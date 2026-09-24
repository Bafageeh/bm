<?php

$sqlitePath = __DIR__ . '/../database/database.sqlite';

$sqlite = new PDO('sqlite:' . $sqlitePath, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

$mysql = new PDO(
    'mysql:host=localhost;dbname=pmsa_bm;charset=utf8mb4',
    'bm_migrate',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$tables = [
    'users',
    'buildings',
    'building_managers',
    'owners',
    'apartments',
    'expenses',
    'expense_owner',
    'owner_payments',
    'expense_categories',
    'expense_attachments',
    'push_tokens',
    'expense_notification_events',
    'user_notifications',
    'personal_access_tokens',
];

$mysql->exec('SET FOREIGN_KEY_CHECKS=0');

foreach ($tables as $table) {
    $exists = $sqlite
        ->query("SELECT name FROM sqlite_master WHERE type='table' AND name=" . $sqlite->quote($table))
        ->fetchColumn();

    if (! $exists) {
        echo "SKIP {$table} (missing in SQLite)\n";
        continue;
    }

    $mysqlColumns = $mysql
        ->query("SHOW COLUMNS FROM " . $table)
        ->fetchAll(PDO::FETCH_COLUMN);

    $sqliteColumns = array_map(
        fn ($row) => $row['name'],
        $sqlite->query("PRAGMA table_info(" . $table . ")")->fetchAll(PDO::FETCH_ASSOC)
    );

    $columns = array_values(array_intersect($mysqlColumns, $sqliteColumns));
    if (! $columns) {
        echo "SKIP {$table} (no common columns)\n";
        continue;
    }

    $mysql->exec("DELETE FROM " . $table);

    $columnSql = implode(',', $columns);
    $placeholders = implode(',', array_fill(0, count($columns), '?'));
    $insert = $mysql->prepare("INSERT INTO " . $table . " (" . $columnSql . ") VALUES (" . $placeholders . ")");

    $selectSql = implode(',', array_map(
        fn ($column) => '"' . str_replace('"', '""', $column) . '"',
        $columns
    ));

    $rows = $sqlite
        ->query("SELECT " . $selectSql . " FROM " . $table)
        ->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as $row) {
        $values = [];
        foreach ($columns as $column) {
            $values[] = array_key_exists($column, $row) ? $row[$column] : null;
        }
        $insert->execute($values);
    }

    echo "COPIED {$table}: " . count($rows) . "\n";
}

$mysql->exec('SET FOREIGN_KEY_CHECKS=1');

echo "VERIFY\n";

$failed = false;

foreach ($tables as $table) {
    $exists = $sqlite
        ->query("SELECT name FROM sqlite_master WHERE type='table' AND name=" . $sqlite->quote($table))
        ->fetchColumn();

    if (! $exists) {
        continue;
    }

    $source = (int) $sqlite->query("SELECT COUNT(*) FROM " . $table)->fetchColumn();
    $target = (int) $mysql->query("SELECT COUNT(*) FROM " . $table)->fetchColumn();

    echo "{$table}: {$source} -> {$target}" . ($source === $target ? " OK" : " MISMATCH") . "\n";
    if ($source !== $target) {
        $failed = true;
    }
}

if ($failed) {
    exit(20);
}

echo "DATA_COPY_OK\n";
