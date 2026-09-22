{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs
    pnpm
    rustc
    cargo
    wasm-pack
    exiftool
  ];

  shellHook = ''
    echo "ExifGuard Development Shell Activated"
    echo "Node.js $(node -v) | Rust $(rustc --version) | ExifTool $(exiftool -ver)"
  '';
}
