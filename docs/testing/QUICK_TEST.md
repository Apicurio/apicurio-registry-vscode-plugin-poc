# Quick Test Guide - Phase 1

## 🚀 Fast Track Testing (5 minutes)

### Option 1: Automated Setup

```bash
cd apicurio-vscode-plugin
./test-setup.sh
```

The script will:
- Install dependencies
- Compile TypeScript
- Optionally start a Docker registry
- Configure VSCode settings
- Add sample data

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Compile
npm run compile

# 3. Start registry (in separate terminal)
docker run -it -p 8080:8080 apicurio/apicurio-registry:latest-snapshot

# 4. Launch in VSCode
code .
# Then press F5
```

## 📋 Quick Test Checklist

In the Extension Development Host window:

1. ✅ Open Explorer sidebar (Cmd+Shift+E / Ctrl+Shift+E)
2. ✅ Find "Apicurio Registry" section
3. ✅ Click "Connect to Registry" button (plug icon)
4. ✅ Select "Local Registry" if prompted
5. ✅ See "Connected to Local Registry" message
6. ✅ Expand tree to see Groups → Artifacts → Versions

## 🐛 Troubleshooting

**Extension doesn't appear?**
- Check Debug Console for errors (Cmd+Shift+Y)
- Rebuild: `npm run compile`
- Reload window: Cmd+R / Ctrl+R

**Can't connect to registry?**
```bash
# Test if registry is running
curl http://localhost:8080/apis/registry/v3/system/info
```

**Changes not showing?**
- Recompile: `npm run compile`
- Reload Extension Dev Host: Cmd+R

## 📚 Full Documentation

See `docs/TESTING_GUIDE.md` for comprehensive testing instructions.
