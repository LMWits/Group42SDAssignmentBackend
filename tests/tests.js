const assert = require('assert');
 
 describe('Hello World Test', () => {
     it('should return true', () => {
         assert.strictEqual(true,true)
     });
 });

 // To test actuall files change the nyc config in package json to     
    // "include": ["*.js"],
    // "exclude": ["tests/**/*.js", "public/**"],
    // "reporter": ["lcov", "text-summary"],
    // "all": true