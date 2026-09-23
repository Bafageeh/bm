<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\ExpenseCategory;
use App\Services\ExpenseNotificationService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class ExpenseCategoryController extends BaseApiController
{
    private array $defaultCategories = ['حارس', 'كهرباء', 'مياه', 'نظافة', 'صيانة', 'مشتريات', 'مصعد'];

    public function index(Request $request, Building $building)
    {
        $this->ensureTableExists();
        $this->assertCanAccessBuilding($request, $building);
        return [
            'data' => $building->expenseCategories()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ];
    }

    public function store(Request $request, Building $building)
    {
        $this->ensureTableExists();
        $this->assertManagerOrAdmin($request, $building);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('expense_categories')->where('building_id', $building->id)],
            'notes' => ['nullable', 'string', 'max:1000'],
            'base_type' => ['sometimes', 'boolean'],
        ]);

        $isBaseType = (bool) ($data['base_type'] ?? false);
        if ($isBaseType) {
            abort_unless($request->user()?->isAdmin(), 403, 'إضافة الأنواع الأساسية متاحة للـ admin فقط.');
        }

        $category = $building->expenseCategories()->create([
            'name' => trim($data['name']),
            'notes' => isset($data['notes']) ? trim((string) $data['notes']) : null,
            'is_active' => ! $isBaseType,
            'sort_order' => ((int) $building->expenseCategories()->max('sort_order')) + 10,
        ]);

        app(ExpenseNotificationService::class)->queueForManager(
            $building,
            $request->user(),
            'expense_type_created',
            'تمت إضافة نوع صرف: '.$category->name.'.'
        );

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, Building $building, ExpenseCategory $category)
    {
        $this->ensureTableExists();
        $this->assertManagerOrAdmin($request, $building);
        $this->assertCategoryBelongsToBuilding($building, $category);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('expense_categories')->where('building_id', $building->id)->ignore($category->id)],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category->update([
            'name' => trim($data['name']),
            'notes' => array_key_exists('notes', $data) ? trim((string) ($data['notes'] ?? '')) : $category->notes,
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $category->is_active,
        ]);

        $freshCategory = $category->fresh();
        app(ExpenseNotificationService::class)->queueForManager(
            $building,
            $request->user(),
            'expense_type_updated',
            'تم تحديث نوع الصرف: '.$freshCategory->name.'.'
        );

        return ['data' => $freshCategory];
    }

    public function destroy(Request $request, Building $building, ExpenseCategory $category)
    {
        $this->ensureTableExists();
        $this->assertManagerOrAdmin($request, $building);
        $this->assertCategoryBelongsToBuilding($building, $category);

        $category->delete();

        return response()->json(['message' => 'تم حذف التصنيف']);
    }

    private function ensureTableExists(): void
    {
        if (! Schema::hasTable('expense_categories')) {
            Schema::create('expense_categories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('building_id')->constrained()->cascadeOnDelete();
                $table->string('name', 100);
                $table->text('notes')->nullable();
                $table->boolean('is_active')->default(false);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();
                $table->unique(['building_id', 'name']);
            });

            return;
        }

        if (! Schema::hasColumn('expense_categories', 'notes')) {
            Schema::table('expense_categories', function (Blueprint $table) {
                $table->text('notes')->nullable()->after('name');
            });
        }

        if (! Schema::hasColumn('expense_categories', 'is_active')) {
            Schema::table('expense_categories', function (Blueprint $table) {
                $table->boolean('is_active')->default(false)->after('notes');
            });
        }
    }

    private function ensureDefaultCategories(Building $building): void
    {
        if ($building->expenseCategories()->exists()) {
            return;
        }

        foreach ($this->defaultCategories as $index => $name) {
            $building->expenseCategories()->create([
                'name' => $name,
                'notes' => null,
                'is_active' => false,
                'sort_order' => ($index + 1) * 10,
            ]);
        }
    }

    private function assertCategoryBelongsToBuilding(Building $building, ExpenseCategory $category): void
    {
        abort_unless((int) $category->building_id === (int) $building->id, 404, 'التصنيف غير موجود في هذا المبنى');
    }
}
