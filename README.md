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
- `exclude: 'path/to/project/root/excludeme|path/to/project/root/excludemetoo'` - Excluded directories. `|` seperates multiple paths.
