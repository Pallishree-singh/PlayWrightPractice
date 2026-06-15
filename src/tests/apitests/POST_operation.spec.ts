import {test,expect} from '@playwright/test';

test('TC31-Create Booking', async({request})=>
{
    //const responseData=await request.post('https://restful-booker.herokuapp.com/booking');
    const payload=
    {
        "firstname" : "Jim",
    "lastname" : "Brown",
    "totalprice" : 111,
    "depositpaid" : true,
    "bookingdates" : {
        "checkin" : "2018-01-01",
        "checkout" : "2019-01-01"
    },
    "additionalneeds" : "Breakfast"
    };

    const responseData=await request.post('https://restful-booker.herokuapp.com/booking', 
        { 
            data: payload 
        });

       expect(responseData.status()).toBe(200);
       const data=await responseData.json();
         console.log(data); 
})