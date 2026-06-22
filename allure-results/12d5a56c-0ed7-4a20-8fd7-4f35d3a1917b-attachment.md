# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apitests\restfullbooker_apiHelper\create_Booking.spec.ts >> @P0 @regression Level 2 (APIHelper) -POST create booking >> POST /booking creates a booking and echoes it back
- Location: src\tests\apitests\restfullbooker_apiHelper\create_Booking.spec.ts:26:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  1  | import {test, expect} from '@playwright/test';
  2  | import {ApiHelper} from '../../../utils/ApiHelper';
  3  | import { createLogger } from '../../../utils/Logger';
  4  | import { visualStep } from '../../../utils/VisualScript';
  5  | 
  6  | interface CreateBookingResponse {
  7  |     bookingid: number;
  8  |     booking: {
  9  |         firstname: string;
  10 |         lastname: string;
  11 |         totalprice: number;
  12 |         depositpaid: boolean;
  13 |         bookingdates: {
  14 |             checkin: string;
  15 |             checkout: string;
  16 |         };
  17 |         additionalneeds: string;
  18 |     }
  19 | }
  20 | 
  21 | 
  22 | const log = createLogger('create_Booking.spec.ts');
  23 | 
  24 | test.describe('@P0 @regression Level 2 (APIHelper) -POST create booking', () => {
  25 |     
  26 |     test('POST /booking creates a booking and echoes it back', async ({request, page}) => {
  27 | 
  28 |         const api = new ApiHelper(request);
  29 |         const payload = {
  30 |             firstname: 'Pallishree',
  31 |             lastname: 'Singh',
  32 |             totalprice: 66,
  33 |             depositpaid: true,
  34 |             bookingdates: {
  35 |                 checkin: '2018-01-01',
  36 |                 checkout: '2019-01-01',
  37 |             },
  38 |             additionalneeds: 'Breakfast',
  39 |         };
  40 | 
  41 |         let response: any;
  42 |         let body: CreateBookingResponse;
  43 | 
  44 |         // Step 1: Send POST /booking request
  45 |         await visualStep(page, 'Send POST /booking request', async () => {
  46 |             log.info('Sending POST /booking request with payload');
  47 |             response = await api.post('/booking', payload);
  48 |             log.info(`Response status: ${response.status()}`);
> 49 |             expect(api.isSuccess(response)).toBe(true);
     |                                             ^ Error: expect(received).toBe(expected) // Object.is equality
  50 |         });
  51 | 
  52 |         // Step 2: Validate response body
  53 |         await visualStep(page, 'Validate booking response body', async () => {
  54 |             log.info('Parsing response and validating booking details');
  55 |             body = await api.parseJsonResponse<CreateBookingResponse>(response as any);
  56 | 
  57 |             expect(body.booking.firstname).toBe(payload.firstname);
  58 |             expect(body.booking.lastname).toBe(payload.lastname);
  59 |             expect(body.booking.totalprice).toBe(payload.totalprice);
  60 |             expect(body.booking.depositpaid).toBe(payload.depositpaid);
  61 |             expect(body.booking.bookingdates.checkin).toBe(payload.bookingdates.checkin);
  62 |             expect(body.booking.bookingdates.checkout).toBe(payload.bookingdates.checkout);
  63 |             expect(body.booking.additionalneeds).toBe(payload.additionalneeds);
  64 |             log.info('All booking assertions passed');
  65 |         });
  66 |     });
  67 | });
```