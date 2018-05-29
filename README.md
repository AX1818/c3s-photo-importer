
### Deploy updated funciton only
command:
- `sls deploy funciton -f` *`[function name]`* `-t`
```bash
sls deploy function -f transform  --aws-profile c3s-serverless
```

### view serverless logs
command: 
- `sls logs -f` *`[function name]`* `-t`

For example:
```bash
sls logs -f transform -t --aws-profile c3s-serverless
```