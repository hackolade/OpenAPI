const fs = require('fs');
const path = require('path');
const uuid = require('node-uuid');
const yaml = require('js-yaml');

const errorHelper = require('./errorHelper');

const CHOICES = ['allOf', 'oneOf', 'anyOf', 'not'];

const getFileData = (filePath) => new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (error, content) => {
        if(error) {
            reject(errorHelper.getOpeningFileError(error));
        } else {
            resolve(content);
        }
    });
});

const getPathData = (filePath) => {
    const extension = path.extname(filePath);
    const fileName = path.basename(filePath, extension);
    return {extension, fileName };
};

const handleErrorObject = (error, title) => {
    return Object.assign({ title}, Object.getOwnPropertyNames(error).reduce((accumulator, key) => {
        return Object.assign(accumulator, {
            [key]: error[key]
        })
    }, {}));
};

const convertYamlToJson = (fileData) => {
    return yaml.load(fileData);
};

const getNewId = () => uuid.v1();

const reorderFields = (data, filedOrder) => {
    if (filedOrder === 'field') {
        return data;
    } else {
        return sortObject(data);
    }
};

const sortObject = (obj) => {
    return Object.keys(obj).sort().reduce((acc,key)=>{
		if (CHOICES.includes(key)) {
			acc[key] = obj[key];
			return acc;
		}
        if (Array.isArray(obj[key])){
            acc[key] = obj[key];
			return acc;
        }
        if (typeof obj[key] === 'object'){
            acc[key]= sortObject(obj[key]);
        }
        else{
            acc[key] = obj[key];
        }
        return acc;
    },{});
};

const stringify = (value) => {
    try {
        return JSON.stringify(value, null, 4);
    } catch (err) {
        return '';
    }
};

module.exports = {
	getFileData,
	getPathData,
    handleErrorObject,
    convertYamlToJson,
    getNewId,
    reorderFields,
    stringify,
	CHOICES
};
