use std::fs;
use miden_standards::code_builder::CodeBuilder;
use miden_mast_package::{PackageManifest, Package};
use std::sync::Arc;

fn main() -> anyhow::Result<()> {
    let masm_path = "contracts/sealed-account/sealed_account.masm";
    let masm_code = fs::read_to_string(masm_path)?;

    println!("Compiling {}...", masm_path);

    // Compile the MASM code into a Library
    let library = CodeBuilder::default()
        .compile_component_code("sealed::account", &masm_code)
        .map_err(|e| anyhow::anyhow!("Compilation failed: {}", e))?;

    let manifest = PackageManifest::from_library(&library);
    let package = Package::new(Arc::new(library), None, manifest, None);
    let masp_bytes = package.to_bytes();

    println!("Successfully compiled. Modules:");
    for module in package.module_infos() {
        println!("  Module: {}", module.path());
        for (name, proc_info) in module.procedures() {
            println!("    - {} (digest: {:?})", name, proc_info.digest);
        }
    }

    fs::write("contracts/sealed-account/sealed_account.masp", masp_bytes)?;
    println!("Successfully wrote sealed_account.masp");

    Ok(())
}
