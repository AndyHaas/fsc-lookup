declare module "@salesforce/apex/fsc_lookupController.search" {
  export default function search(param: {searchTerm: any, objectName: any, fieldsToSearch: any, fieldsToReturn: any, numRecordsToReturn: any, whereClause: any, orderByClause: any}): Promise<any>;
}
declare module "@salesforce/apex/fsc_lookupController.getRecordsFromIds" {
  export default function getRecordsFromIds(param: {objectName: any, fieldsToReturn: any, idsToRetrieve: any}): Promise<any>;
}
declare module "@salesforce/apex/fsc_lookupController.getRecentlyViewed" {
  export default function getRecentlyViewed(param: {objectName: any, fieldsToReturn: any, numRecordsToReturn: any, whereClause: any}): Promise<any>;
}
