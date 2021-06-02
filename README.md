
# Work Calendar

## Requirements
- NPM
- ts-node
- @types/date-fns


## Running
With git, npm, and ts-node installed do
```
git clone && cd into repo
npm install @types/date-fns
npm install @types/node
chmod +x runCases.sh
./runCases.sh
```

## Assumptions and simplifications
-  All time formats are given in in UTC format
- It is not possible to work a night shift. that is, you cannot have midnight between workdaystart and workdayend
- Floating number rounding is not handled thoroughly


