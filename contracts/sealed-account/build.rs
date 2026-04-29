use std::env;
use std::fs;
use std::path::Path;

fn main() {
    println!("cargo:rerun-if-changed=sealed_account.masm");

    let out_dir = env::var_os("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("sealed_account_ast.rs");

    let source = fs::read_to_string("sealed_account.masm").unwrap();
    let code = format!("pub const MASM_CODE: &str = r###\"{}\"###;", source);
    fs::write(dest_path, code).unwrap();
}
