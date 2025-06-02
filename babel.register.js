require('@babel/register')({
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript'
  ],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  ignore: ['node_modules']
})
