# CodeStats
Still under development, only supports java

## Usage
Add this action to your workflow. Example:
```
     - name: Code_Stats
        uses: jojo2357/CodeStats@0.3.0
        with:
          root_dir: 'com/github/jojo2357'
          exclude: 'test'
```

### Settings
Add `with:` to the workflow. Current usable settings:
- `root_dir: 'path/to/project/root'` - Project's root folder
- `exclude: 'excludeme|excludemetoo'` - Excluded directories in relativity to the root. `|` seperates multiple paths.
