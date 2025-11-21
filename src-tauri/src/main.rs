#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State,
};
use std::sync::Mutex;

// Shared state for tray menu status
struct TrayState {
    status: Mutex<String>,
}

#[tauri::command]
fn set_dock_badge(app: AppHandle, value: Option<String>) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
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

#[tauri::command]
fn update_tray_status(app: AppHandle, status: String, state: State<TrayState>) -> Result<(), String> {
    // Update stored status
    if let Ok(mut current_status) = state.status.lock() {
        *current_status = status.clone();
    }
    
    // Update tray tooltip
    if let Some(tray) = app.tray_by_id("main-tray") {
        tray.set_tooltip(Some(&status)).map_err(|e| e.to_string())?;
    }
    
    log::debug!("Tray status updated: {}", status);
    Ok(())
}

#[tauri::command]
fn show_help(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn main() {
    // Configure logging based on build profile
    #[cfg(debug_assertions)]
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Debug)
        .init();
    
    #[cfg(not(debug_assertions))]
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Info)
        .init();
    
    log::info!("Starting Beautify application v{}", env!("CARGO_PKG_VERSION"));
    
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(TrayState {
            status: Mutex::new("Initializing...".to_string()),
        })
        .setup(|app| {
            // Hide from dock on macOS
            #[cfg(target_os = "macos")]
            {
                use tauri::ActivationPolicy;
                app.set_activation_policy(ActivationPolicy::Accessory);
                log::info!("Set macOS activation policy to Accessory (hides from Dock)");
            }
            
            log::info!("Setting up system tray");
            
            // Create tray menu
            let help_item = MenuItem::with_id(app, "help","Help", true, None::<&str>)?;
            let quit_item = PredefinedMenuItem::quit(app, Some("Quit Beautify"))?;
            let menu = Menu::with_items(app, &[&help_item, &PredefinedMenuItem::separator(app)?, &quit_item])?;
            
            // Build tray icon
            let _tray = TrayIconBuilder::with_id("main-tray")
                .menu(&menu)
                .tooltip("Beautify - Initializing...")
                .icon(app.default_window_icon().unwrap().clone())
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            log::info!("Quit requested from tray menu");
                            app.exit(0);
                        }
                        "help" => {
                            log::info!("Help requested from tray menu");
                            if let Err(e) = show_help(app.clone()) {
                                log::error!("Failed to show help: {}", e);
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|_tray, event| {
                    // Handle tray icon clicks (optional functionality)
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        log::debug!("Tray icon left-clicked");
                        // Could show a window or perform an action here
                    }
                })
                .build(app)?;
            
            log::info!("System tray initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_dock_badge,
            request_user_attention,
            update_tray_status,
            show_help
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            log::error!("Fatal error running Tauri application: {}", e);
            std::process::exit(1);
        });
}