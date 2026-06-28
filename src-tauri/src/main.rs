use tauri_plugin_sql::{Migration, MigrationKind};

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}