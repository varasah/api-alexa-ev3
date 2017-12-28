'use strict';

const Alexa = require('alexa-sdk'),
    request = require('request');

const APP_ID = process.env.APP_ID;

const languageStrings = {
    en: {
        translation: {
            SKILL_NAME: 'Remote control',
            WELCOME: '<say-as interpret-as="interjection">moin.</say-as> Use language to control your world.',
            CLAW_NOT_POSSIBLE: 'Unfortunately, I did not understand what to do with the pliers.',
            CLAW_OPEN: '<say-as interpret-as="interjection">open Sesame</say-as>',
            CLAW_VALUE_NOT_POSSIBLE: 'The pliers can only be opened or closed.',
            MOVE_NOT_POSSIBLE: 'Unfortunately I did not understand how to move.',
            MOVE_VALUE_NOT_POSSIBLE: 'The movement can only be forward or backward.',
            HELP_MESSAGE: 'You can say commands such as "Open Forceps," "Move Forward," or \"I\'m thirsty.\"',
            HELP_REPROMPT: 'It does not work? Do not give it!',
            OK: '<say-as interpret-as="interjection">voila.</say-as>',
            DO_IT_DUDE: '<prosody volume="x-loud"><say-as interpret-as="interjection">donnerwetter.</say-as></prosody> Off the wild ride. <say-as interpret-as="interjection">juhu.</say-as>',
            ERROR_INVOKING_API: '<say-as interpret-as="interjection">damned.</say-as> Unfortunately I could not reach the API.',
            STOP_MESSAGE: '<say-as interpret-as="interjection">stop.</say-as>'
        }
    }
};

const baseUrl = 'http://alexaev3api.azurewebsites.net/';

const clawOperationValueMap = {
    'close': 'close',
    'open': 'open'
};

const moveOperationValueMap = {
    'forward': 'forward',
    'backward': 'backward'
};

const handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', this.t('WELCOME'));
    },
    'ClawIntent': function () {
        const clawOperation = this.event.request.intent.slots.ClawOperation;

        if (!clawOperation.value) {
            return this.emit(':ask', this.t('CLAW_NOT_POSSIBLE'));
        }

        const value = clawOperation.value;

        if (!clawOperationValueMap[value]) {
            return this.emit(':ask', this.t('CLAW_VALUE_NOT_POSSIBLE'));
        }

        executeApi('claw/' + clawOperationValueMap[value],
            () => this.emit(':ask', this.t(value === 'open' ? 'CLAW_OPEN' : 'OK')),
            () => this.emit(':tell', this.t('ERROR_INVOKING_API')));
    },
    'MoveIntent': function () {
        const moveOperation = this.event.request.intent.slots.MoveOperation;

        if (!moveOperation.value) {
            return this.emit(':ask', this.t('MOVE_NOT_POSSIBLE'));
        }

        const value = moveOperation.value;

        if (!moveOperationValueMap[value]) {
            return this.emit(':ask', this.t('MOVE_VALUE_NOT_POSSIBLE'));
        }

        executeApi('move/' + moveOperationValueMap[value],
            () => this.emit(':ask', this.t('OK')),
            () => this.emit(':tell', this.t('ERROR_INVOKING_API')));
    },
    'StopIntent': function () {
        executeApi('move/stop',
            () => this.emit(':ask', this.t('OK')),
            () => this.emit(':tell', this.t('ERROR_INVOKING_API')));
    },
    'DoItDudeIntent': function () {
        executeApi('doitdude',
            () => this.emit(':tell', this.t('DO_IT_DUDE')),
            () => this.emit(':tell', this.t('ERROR_INVOKING_API')));
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_REPROMPT');
        this.emit(':ask', speechOutput, reprompt);
    },
    'Unhandled': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_REPROMPT');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function executeApi(api, success, error) {
    request.get(baseUrl + api, function (error, response) {
        if (response.statusCode !== 200) {
            return error();
        }

        success();
    });
}
