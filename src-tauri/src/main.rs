#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager};

#[tauri::command]
fn set_dock_badge(app: AppHandle, value: Option<String>) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        app.set_dock_badge(value).map_err(|error| error.to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        let _ = value;
        Ok(())
    }
}

#[tauri::command]
fn request_user_attention(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::UserAttentionType;

        app.request_user_attention(Some(UserAttentionType::Informational))
            .map_err(|error| error.to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        Ok(())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            set_dock_badge,
            request_user_attention
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
