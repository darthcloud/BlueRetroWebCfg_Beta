# BlueRetroWebCfg
BlueRetro Web-Bluetooth configuration pages

Those pages are base on [Google Chrome Samples](https://github.com/GoogleChrome/samples)

More detail BlueRetro:\
[Main hackaday.io page](https://hackaday.io/project/170365-blueretro)\
[Software files repository](https://github.com/darthcloud/BlueRetro)

## Developing

Once you've created a project and installed dependencies with `pnpm install`, start a development server:

```bash
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev -- --open
```

## Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with `pnpm preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.