// Entry point of dist/devtype.exe. @gpuix/native loads its binding through
// createRequire, which `bun build --compile` cannot follow, so the binding
// is embedded here and its napi-rs loader is pointed at the embedded copy
// (it reads NAPI_RS_NATIVE_LIBRARY_PATH before anything else).
import gpuixBinding from '@gpuix/native-win32-x64-msvc/gpuix-native.win32-x64-msvc.node' with { type: 'file' }

process.env.NAPI_RS_NATIVE_LIBRARY_PATH = gpuixBinding

await import('./main')
