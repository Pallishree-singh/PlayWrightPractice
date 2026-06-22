import {test,expect} from '@playwright/test';

const token='ef202d239e5a5d0';
const bookingId=1766;

test('TC#2-PUT:Update Booking', async({request})=>
{
    //const responseData=await request.post('https://restful-booker.herokuapp.com/booking');
    const payload=
    {
        "firstname" : "Pallishree",
    "lastname" : "Singh",
    "totalprice" : 111,
    "depositpaid" : true,
    "bookingdates" : {
        "checkin" : "2018-01-01",
        "checkout" : "2019-01-01"
    },
    "additionalneeds" : "Breakfast"
    };

    const headers={

        'Accept': 'application/json',
        'Content-Type':'application/json',
        'Cookie': `token=${token}`
    };
    

    const responseData=await request.put(`https://restful-booker.herokuapp.com/booking/${bookingId}`, 
        { 
            headers: headers,
            data: payload 
        });

       expect(responseData.status()).toBe(200);
       const data=await responseData.json();
         console.log(data); 
       expect(data.firstname).toBe(payload.firstname);
       expect(data.lastname).toBe(payload.lastname);  

});