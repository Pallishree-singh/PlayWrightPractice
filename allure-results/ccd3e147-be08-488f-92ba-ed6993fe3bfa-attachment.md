# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apitests\basic_ping.spec.ts >> ping request
- Location: src\tests\apitests\basic_ping.spec.ts:3:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 201
Received: 200
```

# Test source

```ts
  1  | import{test,expect} from '@playwright/test';
  2  | 
  3  | test('ping request', async({request})=>
  4  | {
  5  |   const responseData=await request.get('/ping');
  6  |   console.log(responseData);
> 7  |   expect(responseData.status()).toBe(201);
     |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  8  | 
  9  | 
  10 | })
```