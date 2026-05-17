<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\ExpenseCategory;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class ExpenseCategoryController extends BaseApiController
{
    private array $defaultCategories = ['حارس', 'كهرباء', 'مياه', 'نظافة', 'صيانة', 'مشتريات', 'مصعد', 'أخرى'];

    public function index(Request $request, Building $building)
    {
        $this->ensureTableExists();
        $this->assertCanAccessBuilding($request, $building);
        $this->ensureDefaultCategories($building);

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
        ]);

        $category = $building->expenseCategories()->create([
            'name' => trim($data['name']),
            'sort_order' => ((int) $building->expenseCategories()->max('sort_order')) + 10,
        ]);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, Building $building, ExpenseCategory $category)
    {
        $this->ensureTableExists();
        $this->assertManagerOrAdmin($request, $building);
        $this->assertCategoryBelongsToBuilding($building, $category);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('expense_categories')->where('building_id', $building->id)->ignore($category->id)],
        ]);

        $category->update(['name' => trim($data['name'])]);

        return ['data' => $category->fresh()];
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
        if (Schema::hasTable('expense_categories')) {
            return;
        }

        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('building_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['building_id', 'name']);
        });
    }

    private function ensureDefaultCategories(Building $building): void
    {
        if ($building->expenseCategories()->exists()) {
            return;
        }

        foreach ($this->defaultCategories as $index => $name) {
            $building->expenseCategories()->create([
                'name' => $name,
                'sort_order' => ($index + 1) * 10,
            ]);
        }
    }

    private function assertCategoryBelongsToBuilding(Building $building, ExpenseCategory $category): void
    {
        abort_unless((int) $category->building_id === (int) $building->id, 404, 'التصنيف غير موجود في هذا المبنى');
    }
}
