import {LightningElement, api, track} from 'lwc';

const DATA_TYPE = {
    STRING: 'String',
    BOOLEAN: 'Boolean',
    NUMBER: 'Number',
    INTEGER: 'Integer'
};

const FLOW_EVENT_TYPE = {
    DELETE: 'configuration_editor_input_value_deleted',
    CHANGE: 'configuration_editor_input_value_changed'
}

const defaults = {
    wizardAttributePrefix: 'wiz_',
    NOENCODE: true
};

const VALIDATEABLE_INPUTS = ['objectName', 'fieldsToDisplay'];


export default class Fsc_lookupCPE extends LightningElement {
    typeValue;
    _builderContext = {};
    _values = [];
    _typeMappings = [];

    showChildInputs = false;
    isMultiSelect = false;
    isManualEntry = false;
    isFlowLoaded = false;

    //don't forget to credit https://www.salesforcepoint.com/2020/07/LWC-modal-popup-example-code.html
    @track openModal = false;

    showModal() {
        this.openModal = true;
    }

    closeModal() {
        this.openModal = false;
    }

    @track inputValues = {
        objectName: {value: null, valueDataType: null, isCollection: false, label: 'Lookup which Object?', required: true, errorMessage: 'Please select an object'},
        label: {value: 'Select Record', valueDataType: null, isCollection: false, label: 'Label'},
        fieldsToDisplay: {value: null, valueDataType: null, isCollection: true, label: 'Fields to Display', serialized: true, required: true, errorMessage: 'Please select at least one field to display'},
        fieldsToSearch: {value: null, valueDataType: null, isCollection: true, label: 'Fields to Search', serialized: true},
        whereClause: {value: null, valueDataType: null, isCollection: false, label: 'Filter Criteria'},
        defaultValueInput: {value: null, valueDataType: null, isCollection: false, label: 'Default Value'},
        required: {value: null, valueDataType: null, isCollection: false, label: 'Required'},
        messageWhenValueMissing: {value: 'Please select a record', valueDataType: null, isCollection: false, label: 'Message When Value Missing'},
        showNewRecordAction: {value: null, valueDataType: null, isCollection: false, label: 'Show New Record Action'},
        leftIconName: {value: 'utility:search', valueDataType: null, isCollection: false, label: 'Left Icon Name'},
        rightIconName: {value: 'utility:down', valueDataType: null, isCollection: false, label: 'Right Icon Name'},
        allowMultiselect: {value: false, valueDataType: null, isCollection: false, label: 'Allow Multiselect'},
        fieldLevelHelp: {value: null, valueDataType: null, isCollection: false, label: 'Field Level Help'},
        noMatchString: {value: 'Nothing Found', valueDataType: null, isCollection: false, label: 'Error Text - Nothing Found'},
        placeholder: {value: null, valueDataType: null, isCollection: false, label: 'Placeholder'},
        disabled: {value: null, valueDataType: null, isCollection: false, label: 'Disabled'},
        minimumNumberOfSelectedRecords: {value: null, valueDataType: null, isCollection: false, label: 'Minimum Number of Selected Records'},
        maximumNumberOfSelectedRecords: {value: null, valueDataType: null, isCollection: false, label: 'Maximum Number of Selected Records'},
        minimumNumberOfSelectedRecordsMessage: {value: 'Please select at least {0} records', valueDataType: null, isCollection: false, label: 'Minimum Number of Selected Records Message'},
        maximumNumberOfSelectedRecordsMessage: {value: 'Please select no more than {0} records', valueDataType: null, isCollection: false, label: 'Maximum Number of Selected Records Message'},
    }

    @api get builderContext() {
        return this._builderContext;
    }

    set builderContext(value) {
        this._builderContext = value;
    }

    @api get inputVariables() {
        return this._values;
    }

    set inputVariables(value) {
        this._values = value;
        this.initializeValues();
    }

    @api get genericTypeMappings() {
        return this._genericTypeMappings;
    }
    set genericTypeMappings(value) {
        this._typeMappings = value;
        this.initializeTypeMappings();
    }

    get objectTypes() {
        return [
            {label: 'Standard and Custom', value: ''},
            {label: 'All', value: 'All'},
        ];
    }

    // Input attributes for the Wizard Flow
    @api flowParams = [
        {name: 'objectName', type: 'String', value: null}
    ]

    onquerychange(event) {
        console.log('onquerychange', event.detail);
    }

    updateFlowParam(name, value, ifEmpty=null, noEncode=false) {  
        // Set parameter values to pass to Wizard Flow
        console.log('updateFlowParam:', name, value);        
        let currentValue = this.flowParams.find(param => param.name === name).value;
        if (value != currentValue) {
            if (noEncode) {
                this.flowParams.find(param => param.name === name).value = value || ifEmpty;
            } else { 
                this.flowParams.find(param => param.name === name).value = (value) ? encodeURIComponent(value) : ifEmpty;
            }
        }
    }

    // These are values coming back from the Wizard Flow
    handleFlowStatusChange(event) {
        console.log('=== handleFlowStatusChange ===');
        if(event.detail.status === "FINISHED") {
            // Close Modal
            this.closeModal();
            // Get the output variables from the flow
            let outputVariables = event.detail.outputVariables;
            console.log('outputVariables', outputVariables);
        }

        if (event.detail.status == "ERROR") { 
            console.log('Flow Error: ',JSON.stringify(event));
        } else {      
            this.isFlowLoaded = true;
            event.detail.outputVariables.forEach(attribute => {
                let name = attribute.name;
                let value = attribute.value; 
                console.log('Output from Wizard Flow: ', name, value);

                if (name == 'vSelectionMethod') { 
                    this.vSelectionMethod = value;
                    this.updateFlowParam(name, value, '');
                    this.isNextDisabled = (value) ? false : true;
                }

                if (name == 'vFieldList' && value) { 
                    // Save Selected Fields & Create Collection
                    this.vFieldList = value.split(' ').join('');  //Remove all spaces  
                    this.updateFlowParam(name, value, null, defaults.NOENCODE);
                    this.createFieldCollection(this.vFieldList);
                }

                if (name == 'vEarlyExit') { 
                    // Determine which screen the user exited on
                    this.isEarlyExit = value;
                }

                if (name.substring(0,defaults.wizardAttributePrefix.length) == defaults.wizardAttributePrefix) {
                    let changedAttribute = name.replace(defaults.wizardAttributePrefix, '');                
                    if (event.detail.flowExit && !this.isEarlyExit) { 
                        // Update the wizard variables to force passing the changed values back to the CPE which will then post to the Flow Builder
                        // switch (changedAttribute) { 
                        //     case 'columnFields':
                        //         this.wiz_columnFields = value;
                        //         break;
                        //     case 'columnAlignments':
                        //         this.wiz_columnAlignments = value;
                        //         break;
                        //     case 'columnEdits':
                        //         this.wiz_columnEdits = value;
                        //         this.isNoEdits = (value) ? false : true;
                        //         this.dispatchFlowValueChangeEvent('isRequired', false, 'boolean');
                        //         if (this.isNoEdits) {
                        //             this.updateCheckboxValue('suppressBottomBar', false);
                        //             this.updateCheckboxValue('navigateNextOnSave', false);
                        //             this.isDisableSuppressBottomBar = true;
                        //             this.isDisableNavigateNext = true;
                        //         }
                        //         break;
                        //     case 'columnFilters':
                        //         this.wiz_columnFilters = value;
                        //         this.isNoFilters = (value) ? false : true;
                        //         if (this.isNoFilters) {
                        //             this.updateCheckboxValue('matchCaseOnFilters', false);
                        //         }
                        //         break;
                        //     case 'columnIcons':
                        //         this.wiz_columnIcons = value;
                        //         break;
                        //     case 'columnLabels':
                        //         this.wiz_columnLabels = value;
                        //         break;
                        //     case 'columnWidths':
                        //         this.wiz_columnWidths = value;
                        //         break;
                        //     case 'columnWraps':
                        //         this.wiz_columnWraps = value;
                        //         break;
                        //     case 'columnCellAttribs': 
                        //         this.wiz_columnCellAttribs = value;
                        //         break;
                        //     case 'columnTypeAttribs': 
                        //         this.wiz_columnTypeAttribs = value;
                        //         break;
                        //     case 'columnOtherAttribs': 
                        //         this.wiz_columnOtherAttribs = value;
                        //         break;                                
                        //     default:
                        // }
                        this.isFlowLoaded = false;
                    }
                }
            });
        }
    }

    get wizardParams() {
        // Parameter value string to pass to Wizard Flow
        this.updateFlowParam('objectName', this.inputValues.objectName.value);
        console.log('this.flowParams: ', JSON.stringify(this.flowParams));
        return this.flowParams;
    }

    @api validate() {
        console.log('in validate: ' + JSON.stringify(VALIDATEABLE_INPUTS));
        const validity = [];
        VALIDATEABLE_INPUTS.forEach((input) => {
            console.log('in validate: ' + input + ' = ' + this.inputValues[input].value + ' required: ' + this.inputValues[input].required)
            if ( this.inputValues[input].value?.toString().length == 0 && this.inputValues[input].required) {
                console.log('in validate: ' + input + ' is required');
                let cmp = '';
                if(input == 'fieldsToDisplay'){
                    cmp = 'c-fsc_field-selector-3'
                } else if (input == 'objectName'){
                    cmp = 'c-fsc_object-selector-3'
                }
                const allValid = [...this.template.querySelectorAll(cmp)]
                .reduce((validSoFar, inputCmp) => {
                            inputCmp?.reportValidity();
                            return validSoFar;
                }, true);
                validity.push({
                    key: 'Field Required: ' + this.inputValues[input].label,
                    errorString: this.inputValues[input].errorMessage
                });
            }
        });

        return validity;
    }


    initializeValues(value) {
        if (this._values && this._values.length) {
            this._values.forEach(curInputParam => {
                if (curInputParam.name && this.inputValues[curInputParam.name]) {
                    console.log('in initializeValues: ' + curInputParam.name + ' = ' + curInputParam.value);
                    // console.log('in initializeValues: '+ JSON.stringify(curInputParam));
                    if (this.inputValues[curInputParam.name].serialized) {
                        this.inputValues[curInputParam.name].value = JSON.parse(curInputParam.value);
                    } else {
                        this.inputValues[curInputParam.name].value = curInputParam.value;
                    }
                    this.inputValues[curInputParam.name].valueDataType = curInputParam.valueDataType;
                }

                // If input is isManualEntryFieldsToDisplay, then set the isManualEntry flag
                if (curInputParam.name == 'isManualEntryFieldsToDisplay') {
                    this.isManualEntry = curInputParam.value;
                }

                // If input is allowMultiselect, then set the isMultiSelect flag
                if (curInputParam.name == 'allowMultiselect') {
                    this.isMultiSelect = curInputParam.value;
                }
            });
        }
    }

    initializeTypeMappings() {
        this._typeMappings.forEach((typeMapping) => {
            // console.log(JSON.stringify(typeMapping));
            if (typeMapping.name && typeMapping.value) {
                this.typeValue = typeMapping.value;
            }
        });
    }

    handleValueChange(event) {
        console.log('in handleValueChange: ' + JSON.stringify(event));
        if (event.detail && event.target) {
            // Any component using fsc_flow-combobox will be ran through here
            // This is the newer version and will allow users to use merge fields
            // If event.detail.newValue is set then use it, otherwise use event.detail.value
            let newValue = event.detail.newValue;
            if (newValue == null) {
                newValue = event.detail.value;

                // If event.detail.value.name is set then use it, otherwise use event.detail.value
                if (newValue.name != null) {
                    newValue = newValue.name;
                }
            }
            console.log('(NEW) in handleValueChange: ' + event.target.name + ' = ' + newValue);
            this.dispatchFlowValueChangeEvent(event.target.name, newValue, event.detail.newValueDataType);

            // If event.target.name is allowMultiselect and value is true then isMultiSelect is true
            // Used to disable/enable max and min fields
            if (event.target.name == 'allowMultiselect') {
                if (newValue) {
                    this.isMultiSelect = true;
                } else {
                    this.isMultiSelect = false;

                    // Set minimumNumberOfSelectedRecords and maximumNumberOfSelectedRecords to 0
                    this.dispatchFlowValueChangeEvent('minimumNumberOfSelectedRecords', 0, DATA_TYPE.INTEGER);
                    this.dispatchFlowValueChangeEvent('maximumNumberOfSelectedRecords', 0, DATA_TYPE.INTEGER);
                }
            }
        } else if ( event.detail && event.currentTarget ) {
            // This is the older version for any old inputs that are still using currentTarget
            // Kept for backwards compatibility
            console.log('(OLD) in handleValueChange: ' + event.currentTarget.name + ' = ' + event.detail);
            let dataType = DATA_TYPE.STRING;
            if (event.currentTarget.type == 'checkbox') dataType = DATA_TYPE.BOOLEAN;
            if (event.currentTarget.type == 'number') dataType = DATA_TYPE.NUMBER;
            if (event.currentTarget.type == 'integer') dataType = DATA_TYPE.INTEGER;
            let newValue = event.currentTarget.type === 'checkbox' ? event.currentTarget.checked : event.detail.value;
            this.dispatchFlowValueChangeEvent(event.currentTarget.name, newValue, dataType);
        } else if (event.currentTarget?.name == 'allowMultiselect'){
            // Special case for allowMultiselect
            // Set inputsValues.fieldsToDisplay.value to empty string
            if (event.detail.newValue) {
                this.isMultiSelect = true;
            } else {
                this.isMultiSelect = false;

                // Set minimumNumberOfSelectedRecords and maximumNumberOfSelectedRecords to 0
                this.dispatchFlowValueChangeEvent('minimumNumberOfSelectedRecords', 0, DATA_TYPE.INTEGER);
                this.dispatchFlowValueChangeEvent('maximumNumberOfSelectedRecords', 0, DATA_TYPE.INTEGER);
            }
        } else {
            console.log('in handleValueChange: no event detail');
        }
    }

    handleIconChange(event) {
        this.dispatchFlowValueChangeEvent('iconName', event.detail);
    }

    handleLeftIconChange(event) {
        this.dispatchFlowValueChangeEvent('leftIconName', event.detail);
    }

    handleRightIconChange(event) {
        this.dispatchFlowValueChangeEvent('rightIconName', event.detail);
    }

    handleObjectChange(event) {
        this.dispatchFlowValueChangeEvent('objectName', event.detail.objectType, DATA_TYPE.STRING);
    }

    dispatchFlowValueChangeEvent(id, newValue, dataType = DATA_TYPE.STRING) {
        console.log('in dispatchFlowValueChangeEvent: ' + id, newValue, dataType);
        if (this.inputValues[id] && this.inputValues[id].serialized) {
            console.log('serializing value');
            newValue = JSON.stringify(newValue);
        }
        const valueChangedEvent = new CustomEvent(FLOW_EVENT_TYPE.CHANGE, {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
                name: id,
                newValue: newValue ? newValue : null,
                newValueDataType: dataType
            }
        });
        this.dispatchEvent(valueChangedEvent);
    }
}