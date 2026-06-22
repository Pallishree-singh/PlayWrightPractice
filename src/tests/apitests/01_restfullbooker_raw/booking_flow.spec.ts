import { test, expect } from '@playwright/test';

interface BookingSession {
  token: string;
  bookingId: number;
}

const session: BookingSession = {
  token: '',
  bookingId: 0,
};

const BASE_URL = 'https://restful-booker.herokuapp.com';

test('TC#1 - Create Token', async ({ request }) => {
  const response = await request.post(`${BASE_URL}/auth`, {
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      username: 'admin',
      password: 'password123',
    },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  console.log('Token:', data.token);

  expect(data.token).toBeTruthy();
  session.token = data.token;
});

test('TC#2 - Create Booking', async ({ request }) => {
  const payload = {
    firstname: 'Pallishree',
    lastname: 'Singh',
    totalprice: 111,
    depositpaid: true,
    bookingdates: {
      checkin: '2018-01-01',
      checkout: '2019-01-01',
    },
    additionalneeds: 'Breakfast',
  };

  const response = await request.post(`${BASE_URL}/booking`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    data: payload,
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  console.log('Created Booking:', data);

  expect(data.bookingid).toBeTruthy();
  session.bookingId = data.bookingid;
});

test('TC#3 - Update Booking', async ({ request }) => {
  expect(session.token, 'Token must be set from TC#1').toBeTruthy();
  expect(session.bookingId, 'BookingId must be set from TC#2').toBeTruthy();

  const payload = {
    firstname: 'Pallishree',
    lastname: 'Singh',
    totalprice: 200,
    depositpaid: false,
    bookingdates: {
      checkin: '2024-01-01',
      checkout: '2024-12-31',
    },
    additionalneeds: 'Lunch',
  };

  const response = await request.put(`${BASE_URL}/booking/${session.bookingId}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: `token=${session.token}`,
    },
    data: payload,
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  console.log('Updated Booking:', data);

  expect(data.firstname).toBe(payload.firstname);
  expect(data.lastname).toBe(payload.lastname);
  expect(data.totalprice).toBe(payload.totalprice);
  expect(data.additionalneeds).toBe(payload.additionalneeds);
});
