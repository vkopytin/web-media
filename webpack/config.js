const path = require('path');
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');


const RM = {
    combine() {
        const args = [].slice.call(arguments);
        return function (config, options) {
            const items = [].slice.call(args);
            let next, res = config;
      
            // tslint:disable-next-line:no-conditional-assignment
            while (next = items.shift()) {
                res = next(res, options);
            }
            return res;
        };
    },
    fileNameFormat(config, options) {
        const fileNameFormat = options.FILE_NAME_FORMAT;
        return {
            ...config
        };
    },
    module_rules(config, options) {
        return {
            ...config,
            module: {
                ...config.module,
                rules: [...config.module.rules, {
                    test: /\.css$/,
                    use: [{
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: process.env.NODE_ENV === 'development',
                        },
                    }, {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    }, {
                        loader: 'resolve-url-loader'
                    }, {
                        loader: 'postcss-loader'
                    }]
                }]
            }
        };
    },
    output: {
        publicPath(config, options) {
            return {
                ...config,
                output: {
                    ...config.output,
                    publicPath: options.CDN + options.PUBLIC_DIR,
                }
            };
        },
        path(config, options) {
            return {
                ...config,
                output: {
                    ...config.output,
                    path: path.resolve(path.join(__dirname, '../', 'app', options.PUBLIC_DIR))
                }
            };
        }
    },
    plugins: {
        cleanCleanWebpackPlugin(config, options) {
            return {
                ...config,
                plugins: [
                    ...config.plugins,
                    new CleanWebpackPlugin()
                ]
            };
        },
        optimizeJS(config, optoins) {
            const plugins = [
                new OptimizeCssAssetsPlugin({
                    cssProcessor: require('cssnano'),
                    cssProcessorOptions: {
                        sourcemap: false,
                        discardDuplicates: {
                            removeAll: true
                        },
                        discardComments: {
                            removeAll: true
                        },
                        // Run cssnano in safe mode to avoid
                        // potentially unsafe transformations.
                        safe: true,
                    },
                    canPrint: false,
                })
            ];
            return {
                ...config,
                plugins: [...config.plugins, ...plugins]
            };
        },
        extra(config, options) {
            const FILE_NAME_PATTERN = options.FILE_NAME_PATTERN;
            const suppressPart = (pattern, options) => Object.keys(options)
                .reduce((res, key) => res.replace('[' + key + ']', options[key]), pattern);
            return {
                ...config,
                plugins: [
                    ...config.plugins,
                    new webpack.DefinePlugin({
                        'process.env.PLAYER_NAME': `'${process.env.PLAYER_NAME}'`
                    }),
                    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/), // https://stackoverflow.com/questions/25384360/how-to-prevent-moment-js-from-loading-locales-with-webpack
                    new MiniCssExtractPlugin({
                        // Options similar to the same options in webpackOptions.output
                        // all options are optional
                        filename: suppressPart(FILE_NAME_PATTERN, {
                            path: '',
                            name: 'app',
                            ext: 'css'
                        }) // e.g. app.[hash].css
                    })
                ]
            }
        }
    }
};

module.exports = RM;
