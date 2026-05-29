use tauri_plugin_updater::UpdaterExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Check for updates silently on startup (release builds only)
      #[cfg(not(debug_assertions))]
      {
        let handle = app.handle().clone();
        tauri::async_runtime::spawn(async move {
          if let Ok(updater) = handle.updater() {
            if let Ok(Some(update)) = updater.check().await {
              if update.download_and_install(|_, _| {}, || {}).await.is_ok() {
                handle.restart();
              }
            }
          }
        });
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
