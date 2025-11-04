const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
    target: 'node', // vscode extensions run in a Node.js context

    entry: './src/extension.ts', // the entry point of this extension
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    devtool: 'source-map',
    externals: {
        vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: [
                    /node_modules/,
                    /\.test\.ts$/,
                    path.resolve(__dirname, 'src/webview') // Webview code is built by Vite, not webpack
                ],
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            // Don't typecheck webview files
                            onlyCompileBundledFiles: true
                        }
                    }
                ]
            }
        ]
    },
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    optimization: {
        minimize: false
    }
};

module.exports = config;