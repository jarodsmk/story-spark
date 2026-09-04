pub mod fs_layer;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to StorySpark.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            fs_layer::read_novel_file,
            fs_layer::write_novel_file,
            fs_layer::list_novel_files,
            fs_layer::delete_novel_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running StorySpark application");
}
