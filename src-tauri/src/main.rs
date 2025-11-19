#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager};

#[tauri::command]
fn set_dock_badge(app: AppHandle, value: Option<String>) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::Emitter;
        app.emit("dock-badge", value).map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, value);
        Ok(())
    }
}

#[tauri::command]
fn request_user_attention(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        if let Some(window) = app.get_webview_window("main") {
            window.set_focus().map_err(|e| e.to_string())?;
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        Ok(())
    }
}

fn main() {
    env_logger::init();
    log::info!("Starting Beautify application");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            set_dock_badge,
            request_user_attention
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}