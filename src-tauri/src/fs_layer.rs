use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct NovelFileInfo {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
}

/// Sanitizes relative path to prevent directory traversal outside the project directory.
fn sanitize_path(base_dir: &str, relative_path: &str) -> Result<PathBuf, String> {
    let base = Path::new(base_dir);
    if !base.is_absolute() && !base.exists() {
        // Create base if relative or not existing
        fs::create_dir_all(base).map_err(|e| format!("Failed to create base dir: {}", e))?;
    }

    let clean_rel = relative_path.trim_start_matches(['/', '\\']);
    if clean_rel.contains("..") {
        return Err("Directory traversal not permitted".to_string());
    }

    let full_path = base.join(clean_rel);
    Ok(full_path)
}

#[tauri::command]
pub fn read_novel_file(base_dir: String, relative_path: String) -> Result<String, String> {
    let full_path = sanitize_path(&base_dir, &relative_path)?;
    if !full_path.exists() {
        return Err(format!("File does not exist: {}", full_path.display()));
    }

    fs::read_to_string(&full_path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn write_novel_file(base_dir: String, relative_path: String, content: String) -> Result<bool, String> {
    let full_path = sanitize_path(&base_dir, &relative_path)?;
    
    if let Some(parent) = full_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory structure: {}", e))?;
        }
    }

    // Atomic write via temp file
    let tmp_path = full_path.with_extension("tmp.swp");
    fs::write(&tmp_path, &content).map_err(|e| format!("Failed to write temp file: {}", e))?;
    
    fs::rename(&tmp_path, &full_path)
        .map_err(|e| format!("Failed to atomic replace file: {}", e))?;

    Ok(true)
}

#[tauri::command]
pub fn list_novel_files(base_dir: String, relative_path: String) -> Result<Vec<NovelFileInfo>, String> {
    let target_dir = sanitize_path(&base_dir, &relative_path)?;
    if !target_dir.exists() {
        fs::create_dir_all(&target_dir).map_err(|e| format!("Failed to create dir: {}", e))?;
    }

    let entries = fs::read_dir(&target_dir)
        .map_err(|e| format!("Failed to read directory {}: {}", target_dir.display(), e))?;

    let mut list = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            let file_type = entry.file_type().map_err(|e| e.to_string())?;
            let metadata = entry.metadata().map_err(|e| e.to_string())?;
            let name = entry.file_name().to_string_lossy().into_owned();
            let path = entry.path().to_string_lossy().into_owned();

            list.push(NovelFileInfo {
                name,
                path,
                is_dir: file_type.is_dir(),
                size: metadata.len(),
            });
        }
    }

    list.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        } else if a.is_dir {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });

    Ok(list)
}

#[tauri::command]
pub fn delete_novel_file(base_dir: String, relative_path: String) -> Result<bool, String> {
    let full_path = sanitize_path(&base_dir, &relative_path)?;
    if !full_path.exists() {
        return Ok(false);
    }

    if full_path.is_dir() {
        fs::remove_dir_all(&full_path).map_err(|e| format!("Failed to remove directory: {}", e))?;
    } else {
        fs::remove_file(&full_path).map_err(|e| format!("Failed to remove file: {}", e))?;
    }

    Ok(true)
}
