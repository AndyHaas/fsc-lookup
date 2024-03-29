declare module "@salesforce/apex/fsc_lookupController.search" {
  export default function search(param: {searchTerm: any, objectName: any, fieldsToSearch: any, fieldsToReturn: any, numRecordsToReturn: any, whereClause: any, orderByClause: any}): Promise<any>;
}
declare module "@salesforce/apex/fsc_lookupController.getRecordsFromIds" {
  export default function getRecordsFromIds(param: {objectName: any, fieldsToReturn: any, idsToRetrieve: any}): Promise<any>;
}
declare module "@salesforce/apex/fsc_lookupController.getRecentlyViewed" {
  export default function getRecentlyViewed(param: {objectName: any, fieldsToReturn: any, numRecordsToReturn: any, whereClause: any}): Promise<any>;
}
declare module "@salesforce/apex/fsc_lookupController.getRecords" {
  export default function getRecords(param: {objectName: any, fieldsToReturn: any, numRecordsToReturn: any, whereClause: any}): Promise<any>;
}
declare module "@salesforce/apex/fsc_lookupController.getObjectIcon" {
  export default function getObjectIcon(param: {objectName: any}): Promise<any>;
}
declare module "@salesforce/apex/fsc_lookupController.getRecordDetail" {
  export default function getRecordDetail(param: {objectName: any, recordIds: any}): Promise<any>;
}
