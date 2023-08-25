// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  awork: {
    url: 'https://api.awork.io/api/v1',
    clientId: 'awork-ext',
    clientSecret: '',
    redirectUrl: 'http://localhost',
    scope: 'offline_access',
    token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWYzZDk2OC1mZTdmLTRlM2YtYjEzZC0yNWMyODRmZDIzZWQiLCJuYW1lIjoicmF2ZXJtYS5tZUBnbWFpbC5jb20iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJyYXZlcm1hLm1lQGdtYWlsLmNvbSIsImlpZCI6IjExZjNkOTY4LWZlN2YtNGUzZi1iMTNkLTI1YzI4NGZkMjNlZCIsIndpZCI6IjNjOWRiZjRlLWI5ZTQtNDg4NS04ODg5LWNkMzM5NjQ1NjBjYyIsInVpZCI6IjhiMGVlNWE2LTQwZDQtNDA1Ny1hMzE5LWFlMDAzNjA1NzRlNSIsInNjb3BlIjoib2ZmbGluZV9hY2Nlc3MiLCJhenAiOiJhd29yay1leHQiLCJ0b2tlbl91c2FnZSI6ImFjY2Vzc190b2tlbiIsImNmZF9sdmwiOiJwcml2YXRlIiwibmJmIjoxNjkyOTU1ODI5LCJleHAiOjE2OTMwNDIyMjksImlzcyI6Imh0dHBzOi8vYXBpLmF3b3JrLmlvLyIsImF1ZCI6ImF3b3JrLmlvIn0.BjfielOvACp698D6oepeP-AJ7vliisUw6PKzq0i3nI4'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
