use std::{
    env,
    io::{self, Write},
    path::{Path, PathBuf},
    sync::Arc,
};

use fs_err as fs;
use miden_assembly::{
    self as masm, Assembler, Library, Report,
    diagnostics::IntoDiagnostic,
};

// CONSTANTS
// ================================================================================================

const ASM_DIR_PATH: &str = "asm";
const ASL_DIR_PATH: &str = "assets";
const DOC_DIR_PATH: &str = "docs";

// MARKDOWN RENDERER
// ================================================================================================

pub struct MarkdownRenderer {}

impl MarkdownRenderer {
    fn write_docs_header(mut writer: &fs::File, ns: &str) {
        let header =
            format!("\n## {ns}\n| Procedure | Description |\n| ----------- | ------------- |\n");
        writer.write_all(header.as_bytes()).expect("unable to write header to writer");
    }

    fn write_docs_procedure(mut writer: &fs::File, name: &str, docs: Option<&str>) {
        if let Some(docs) = docs {
            let escaped = docs.replace('|', "\\|").replace('\n', "<br />");
            let line = format!("| {name} | {escaped} |\n");
            writer.write_all(line.as_bytes()).expect("unable to write func to writer");
        }
    }
}

// PRE-PROCESSING
// ================================================================================================

fn main() -> Result<(), Report> {
    use miden_assembly::diagnostics::reporting::ReportHandlerOpts;

    println!("cargo:rerun-if-changed=asm");
    println!("cargo:rerun-if-env-changed=MIDEN_BUILD_LIB_DOCS");
    println!("cargo:rerun-if-changed=../../assembly/src");

    miden_assembly::diagnostics::reporting::set_hook(Box::new(|_| {
        Box::new(ReportHandlerOpts::new().build())
    }))
    .unwrap();
    miden_assembly::diagnostics::reporting::set_panic_hook();

    env_logger::Builder::from_env("MIDEN_LOG").format_timestamp(None).init();

    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let asm_dir = Path::new(manifest_dir).join(ASM_DIR_PATH);

    let assembler = Assembler::default();
    let namespace = masm::Path::new("miden::core");
    let package = assembler
        .assemble_library_from_dir(&asm_dir, namespace)
        .expect("failed to assemble core library");

    let build_dir = PathBuf::from(env::var("OUT_DIR").unwrap());

    // write the masl output
    let asl_dir = build_dir.join(ASL_DIR_PATH);
    fs::create_dir_all(&asl_dir).unwrap();
    
    package
        .write_to_file(
            asl_dir
                .join("core")
                .with_extension(Library::LIBRARY_EXTENSION),
        )
        .map_err(|e| io::Error::other(e.to_string()))
        .into_diagnostic()?;

    Ok(())
}
