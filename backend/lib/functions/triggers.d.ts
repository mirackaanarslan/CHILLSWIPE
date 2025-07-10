import * as functions from 'firebase-functions';
export declare const onBetCreated: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const onMarketStatusChanged: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
export declare const onUserCreated: functions.CloudFunction<import("firebase-admin/auth").UserRecord>;
//# sourceMappingURL=triggers.d.ts.map