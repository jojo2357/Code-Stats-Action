# CodeStats
<a href="https://github.com/search?o=desc&q=jojo2357%2FCodeStats+path%3A.github%2Fworkflows+language%3AYAML&s=&type=Code" target="_blank" title="Public workflows that use this action.">
     <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fapi-git-master.endbug.vercel.app%2Fapi%2Fgithub-actions%2Fused-by%3Faction%3Djojo2357%2FCodeStats%26badge%3Dtrue" alt="Public workflows that use this action.">
</a>

Still under development, supports multiple languages including java, python and c/c#/c++

## Usage
Add this action to your workflow. Example:
```
     - name: Code_Stats
        uses: jojo2357/CodeStats@0.4.0
        with:
          root_dir: 'com/github/jojo2357'
          exclude: 'test'
```

### Settings
Add `with:` to the workflow. Current usable settings:
- `root_dir: 'path/to/project/root'` - Project's root folder
- `exclude: 'excludeme|excludemetoo'` - Excluded directories in relativity to the root. `|` seperates multiple paths.
