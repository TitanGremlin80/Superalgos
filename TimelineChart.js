﻿function newTimelineChart() {

    const MODULE_NAME = "Timeline Chart";
    const INFO_LOG = false;
    const INTENSIVE_LOG = false;
    const ERROR_LOG = true;
    const logger = newDebugLog();
    logger.fileName = MODULE_NAME;

    let productPlotters = [];
    let competitionPlotters = [];

    let timeLineCoordinateSystem = newTimeLineCoordinateSystem();

    let timePeriod = INITIAL_TIME_PERIOD;
    let datetime = INITIAL_DATE;

    let thisObject = {
        setDatetime: setDatetime,
        container: undefined,
        draw: draw,
        getContainer: getContainer,
        initialize: initialize
    };

    let container = newContainer();
    container.initialize();
    thisObject.container = container;

    container.displacement.containerName = "Time Period Chart";
    container.frame.containerName = "Time Period Chart";

    let marketId;
    let exchangeId;

    let level;

    let chartGrid;

    let initializationReady = false;

    let productsPanel;

    return thisObject;

    function initialize(exchange, market, pProductsPanel, callBackFunction) {

        try {

            if (INFO_LOG === true) { logger.write("[INFO] initialize -> Entering function."); }

            /* Remember the Products Panel */

            productsPanel = pProductsPanel;

            /* Listen to the event of change of status */

            productsPanel.container.eventHandler.listenToEvent("Product Card Status Changed", onProductCardStatusChanged);

            /* Legacy code to clean */

            marketId = market;
            exchangeId = exchange;

            chartGrid = newChartGrid();

            recalculateScale();
            
            //moveViewPortToCurrentDatetime();
            moveToUserPosition(container, timeLineCoordinateSystem);
            timePeriod = INITIAL_TIME_PERIOD;
            datetime = INITIAL_DATE;
            
            /* Event Subscriptions - we need this events to be fired first here and then in active Plotters. */

            viewPort.eventHandler.listenToEvent("Offset Changed", onOffsetChanged);
            viewPort.eventHandler.listenToEvent("Zoom Changed", onZoomChanged);
            canvas.eventHandler.listenToEvent("Drag Finished", onDragFinished);

            initializeCompetitionPlotters(onCompetitionPlottersInitialized);

            function onCompetitionPlottersInitialized(err) {

                try {

                    if (INFO_LOG === true) { logger.write("[INFO] initialize -> onCompetitionPlottersInitialized -> Entering function."); }

                    switch (err.result) {
                        case GLOBAL.DEFAULT_OK_RESPONSE.result: {

                            if (INFO_LOG === true) { logger.write("[INFO] initialize -> onCompetitionPlottersInitialized -> Received OK Response."); }
                            break;
                        }

                        case GLOBAL.DEFAULT_FAIL_RESPONSE.result: {

                            if (INFO_LOG === true) { logger.write("[INFO] initialize -> onCompetitionPlottersInitialized -> Received FAIL Response."); }
                            callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE);
                            return;
                        }

                        default: {

                            if (INFO_LOG === true) { logger.write("[INFO] initialize -> onFileCursorReady -> Received Unexpected Response."); }
                            callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE);
                            return;
                        }
                    }

                    initializeProductPlotters(onProductPlottersInitialized);

                    function onProductPlottersInitialized(err) {

                        try {

                            if (INFO_LOG === true) { logger.write("[INFO] initialize -> onCompetitionPlottersInitialized -> onProductPlottersInitialized -> Entering function."); }

                            switch (err.result) {
                                case GLOBAL.DEFAULT_OK_RESPONSE.result: {

                                    if (INFO_LOG === true) { logger.write("[INFO] initialize -> onCompetitionPlottersInitialized -> onProductPlottersInitialized ->  Received OK Response."); }

                                    initializationReady = true;
                                    callBackFunction(GLOBAL.DEFAULT_OK_RESPONSE);
                                    break;
                                }

                                case GLOBAL.DEFAULT_FAIL_RESPONSE.result: {

                                    if (INFO_LOG === true) { logger.write("[INFO] initialize -> onCompetitionPlottersInitialized -> onProductPlottersInitialized ->  Received FAIL Response."); }
                                    callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE);
                                    return;
                                }

                                default: {

                                    if (INFO_LOG === true) { logger.write("[INFO] initialize -> onCompetitionPlottersInitialized -> onProductPlottersInitialized ->  Received Unexpected Response."); }
                                    callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE);
                                    return;
                                }
                            }

                        } catch (err) {

                            if (ERROR_LOG === true) { logger.write("[ERROR] initialize -> onCompetitionPlottersInitialized -> onProductPlottersInitialized -> err = " + err); }
                            callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE);
                        }
                    }

                } catch (err) {

                    if (ERROR_LOG === true) { logger.write("[ERROR] initialize -> onCompetitionPlottersInitialized -> err = " + err); }
                    callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE);
                }
            }

        } catch (err) {

            if (ERROR_LOG === true) { logger.write("[ERROR] initialize -> err = " + err); }
            callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE);
        }
    }

    function initializeCompetitionPlotters(callBack) {

        try {

            if (INFO_LOG === true) { logger.write("[INFO] initializeCompetitionPlotters -> Entering function."); }

            /* At this current version of the platform, we will support only one competition with only one plotter. */

            const COMPETITION_HOST = "AAArena";
            const COMPETITION = "First-Closed-Door";

            let objName = COMPETITION_HOST + "-" + COMPETITION;
            let storage = newCompetitionStorage(objName);

            let host = ecosystem.getHost(COMPETITION_HOST);
            let competition = ecosystem.getCompetition(host, COMPETITION);

            storage.initialize(host, competition, DEFAULT_EXCHANGE, DEFAULT_MARKET, onCompetitionStorageInitialized);

            function onCompetitionStorageInitialized(err) {

                try {

                    if (INFO_LOG === true) { logger.write("[INFO] initializeCompetitionPlotters -> onCompetitionStorageInitialized -> Entering function."); }

                    switch (err.result) {
                        case GLOBAL.DEFAULT_OK_RESPONSE.result: {

                            if (INFO_LOG === true) { logger.write("[INFO] initializeCompetitionPlotters -> onCompetitionStorageInitialized -> Received OK Response."); }
                            break;
                        }

                        case GLOBAL.DEFAULT_FAIL_RESPONSE.result: {

                            if (INFO_LOG === true) { logger.write("[INFO] initializeCompetitionPlotters -> onCompetitionStorageInitialized -> Received FAIL Response."); }
                            callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
                            return;
                        }

                        default: {

                            if (INFO_LOG === true) { logger.write("[INFO] initializeCompetitionPlotters -> onCompetitionStorageInitialized -> Received Unexpected Response."); }
                            callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
                            return;
                        }
                    }

                    /* Now we have all the initial data loaded and ready to be delivered to the new instance of the plotter. */

                    let plotter = getNewPlotter(competition.plotter.host, competition.plotter.codeName, competition.plotter.moduleName);

                    plotter.container.displacement.parentDisplacement = thisObject.container.displacement;
                    plotter.container.frame.parentFrame = thisObject.container.frame;

                    plotter.container.parentContainer = thisObject.container;

                    plotter.container.frame.width = thisObject.container.frame.width * 1;
                    plotter.container.frame.height = thisObject.container.frame.height * 1;

                    plotter.container.frame.position.x = thisObject.container.frame.width / 2 - plotter.container.frame.width / 2;
                    plotter.container.frame.position.y = thisObject.container.frame.height / 2 - plotter.container.frame.height / 2;

                    /* We add the profile picture of each participant, because the plotter will need it. */

                    for (let k = 0; k < competition.participants.length; k++) {

                        let participant = competition.participants[k];
                        let devTeam = ecosystem.getTeam(participant.devTeam);
                        let bot = ecosystem.getBot(devTeam, participant.bot);
                        participant.profilePicture = bot.profilePicture;

                    }

                    plotter.initialize(competition, storage, datetime, timePeriod, onPlotterInizialized);

                    function onPlotterInizialized(err) {

                        try {

                            if (INFO_LOG === true) { logger.write("[INFO] initializeCompetitionPlotters -> onCompetitionStorageInitialized -> onPlotterInizialized -> Entering function."); }

                            switch (err.result) {
                                case GLOBAL.DEFAULT_OK_RESPONSE.result: {

                                    if (INFO_LOG === true) { logger.write("[INFO] initializeCompetitionPlotters -> onCompetitionStorageInitialized -> onPlotterInizialized -> Received OK Response."); }
                                    break;
                                }

                                case GLOBAL.DEFAULT_FAIL_RESPONSE.result: {

                                    if (INFO_LOG === true) { logger.write("[INFO] initializeCompetitionPlotters -> onCompetitionStorageInitialized -> onPlotterInizialized -> Received FAIL Response."); }
                                    callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
                                    return;
                                }

                                default: {

                                    if (INFO_LOG === true) { logger.write("[INFO] initializeCompetitionPlotters -> onCompetitionStorageInitialized -> onPlotterInizialized -> Received Unexpected Response."); }
                                    callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
                                    return;
                                }
                            }

                            let competitionPlotter = {
                                plotter: plotter,
                                storage: storage
                            };

                            /* Add the new Active Protter to the Array */

                            competitionPlotters.push(competitionPlotter);

                            /* Create The Profie Picture FloatingObject */

                            if (competitionPlotter.plotter.payload !== undefined) {

                                for (let k = 0; k < competition.participants.length; k++) {

                                    let participant = competition.participants[k];
                                    let devTeam = ecosystem.getTeam(participant.devTeam);
                                    let bot = ecosystem.getBot(devTeam, participant.bot);
                                    let imageId = participant.devTeam + "." + participant.profilePicture;

                                    competitionPlotter.plotter.payload[k].profile.downLabel = bot.displayName;
                                    competitionPlotter.plotter.payload[k].profile.imageId = imageId;

                                    canvas.floatingSpace.profileBalls.createNewProfileBall(competitionPlotter.plotter.payload[k], onProfileBallCreated)

                                    function onProfileBallCreated(err, pProfileHandle) {

                                        competitionPlotter.plotter.payload[k].profile.handle = pProfileHandle;

                                    }
                                }
                            }

                            callBack(GLOBAL.DEFAULT_OK_RESPONSE);

                        } catch (err) {

                            if (ERROR_LOG === true) { logger.write("[ERROR] initializeCompetitionPlotters -> onCompetitionStorageInitialized -> onPlotterInizialized -> err = " + err); }
                            callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
                        }
                    }

                } catch (err) {

                    if (ERROR_LOG === true) { logger.write("[ERROR] initializeCompetitionPlotters -> onCompetitionStorageInitialized -> err = " + err); }
                    callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
                }
            }

        } catch (err) {

            if (ERROR_LOG === true) { logger.write("[ERROR] initializeCompetitionPlotters -> err = " + err); }
            callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
        }
    }

    function initializeProductPlotters(callBack) {

        try {

            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotters -> Entering function."); }

            /* Lets get all the cards that needs to be loaded. */

            let initializationCounter = 0;
            let loadingProductCards = productsPanel.getLoadingProductCards();
            let okCounter = 0;
            let failCounter = 0;

            for (let i = 0; i < loadingProductCards.length; i++) {

                /* For each one, we will initialize the associated plotter. */

                initializeProductPlotter(loadingProductCards[i], onProductPlotterInitialized);

                function onProductPlotterInitialized(err) {

                    if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotters -> onProductPlotterInitialized -> Entering function."); }

                    initializationCounter++;

                    switch (err.result) {
                        case GLOBAL.DEFAULT_OK_RESPONSE.result: {

                            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotters -> onProductPlotterInitialized -> onProductPlotterInitialized -> Received OK Response."); }
                            okCounter++;
                            break;
                        }

                        case GLOBAL.DEFAULT_FAIL_RESPONSE.result: {

                            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotters -> onProductPlotterInitialized -> onProductPlotterInitialized -> Received FAIL Response."); }
                            failCounter++;
                            break;
                        }

                        default: {

                            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotters -> onProductPlotterInitialized -> onProductPlotterInitialized -> Received Unexpected Response."); }
                            failCounter++;
                            break;
                        }
                    }

                    if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotters -> onProductPlotterInitialized -> onProductPlotterInitialized -> initializationCounter = " + initializationCounter); }
                    if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotters -> onProductPlotterInitialized -> onProductPlotterInitialized -> okCounter = " + okCounter); }
                    if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotters -> onProductPlotterInitialized -> onProductPlotterInitialized -> failCounter = " + failCounter); }
                    if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotters -> onProductPlotterInitialized -> onProductPlotterInitialized -> loadingProductCards.length = " + loadingProductCards.length); }

                    if (initializationCounter === loadingProductCards.length) { // This was the last one.

                        if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotters -> onProductPlotterInitialized -> onProductPlotterInitialized -> Last Product Loaded."); }

                        /* If less than 50% of plotters are initialized then we return FAIL. */

                        if (okCounter >= 1) {
                            callBack(GLOBAL.DEFAULT_OK_RESPONSE);
                        } else {
                            callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
                        }
                    }
                }
            }

        } catch (err) {

            if (ERROR_LOG === true) { logger.write("[ERROR] initializeProductPlotters -> err = " + err); }
            callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
        }
    } 

    function initializeProductPlotter(pProductCard, callBack) {

        try {

            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> Entering function."); }

            /* Before Initializing a Plotter, we need the Storage it will use, loaded with the files it will initially need. */

            let objName = pProductCard.devTeam.codeName + "-" + pProductCard.bot.codeName + "-" + pProductCard.product.codeName;
            let storage = newProductStorage(objName);

            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> objName = " + objName); }

            /*
    
            Before Initializing the Storage, we will put the Product Card to listen to the events the storage will raise every time a file is loaded,
            so that the UI can somehow show this. There are different types of events. 
    
            */

            for (let i = 0; i < pProductCard.product.dataSets.length; i++) {

                let thisSet = pProductCard.product.dataSets[i];

                switch (thisSet.type) {
                    case 'Market Files': {
                        storage.eventHandler.listenToEvent('Market File Loaded', pProductCard.onMarketFileLoaded);
                    }
                        break;

                    case 'Daily Files': {
                        storage.eventHandler.listenToEvent('Daily File Loaded', pProductCard.onDailyFileLoaded);
                    }
                        break;

                    case 'Single File': {
                        storage.eventHandler.listenToEvent('Single File Loaded', pProductCard.onSingleFileLoaded);
                    }
                        break;

                    case 'File Sequence': {
                        storage.eventHandler.listenToEvent('File Sequence Loaded', pProductCard.onFileSequenceLoaded);
                    }
                        break;
                }
            }

            storage.initialize(pProductCard.devTeam, pProductCard.bot, pProductCard.product, DEFAULT_EXCHANGE, DEFAULT_MARKET, datetime, timePeriod, onProductStorageInitialized);

            function onProductStorageInitialized(err) {

                try {

                    if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> onProductStorageInitialized -> Entering function."); }
                    if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> onProductStorageInitialized -> key = " + pProductCard.devTeam.codeName + "-" + pProductCard.bot.codeName + "-" + pProductCard.product.codeName); }

                    switch (err.result) {
                        case GLOBAL.DEFAULT_OK_RESPONSE.result: {

                            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> onProductStorageInitialized -> Received OK Response."); }
                            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> onProductStorageInitialized -> The plotter will be started."); }
                            break;
                        }

                        case GLOBAL.DEFAULT_FAIL_RESPONSE.result: {

                            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> onProductStorageInitialized -> Received FAIL Response."); }
                            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> onProductStorageInitialized -> The plotter will not be started."); }
                            callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
                            return;
                        }

                        default: {

                            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> onProductStorageInitialized -> Received Unexpected Response."); }
                            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> onProductStorageInitialized -> The plotter will not be started."); }
                            callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
                            return;
                        }
                    }

                    /* Now we have all the initial data loaded and ready to be delivered to the new instance of the plotter. */

                    let plotter = getNewPlotter(pProductCard.product.plotter.devTeam, pProductCard.product.plotter.codeName, pProductCard.product.plotter.moduleName);

                    plotter.container.displacement.parentDisplacement = thisObject.container.displacement;
                    plotter.container.frame.parentFrame = thisObject.container.frame;

                    plotter.container.parentContainer = thisObject.container;

                    plotter.container.frame.width = thisObject.container.frame.width * 1;
                    plotter.container.frame.height = thisObject.container.frame.height * 1;

                    plotter.container.frame.position.x = thisObject.container.frame.width / 2 - plotter.container.frame.width / 2;
                    plotter.container.frame.position.y = thisObject.container.frame.height / 2 - plotter.container.frame.height / 2;

                    plotter.initialize(storage, DEFAULT_EXCHANGE, DEFAULT_MARKET, datetime, timePeriod, onPlotterInizialized);

                    function onPlotterInizialized() {

                        try {

                            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> onProductStorageInitialized -> onPlotterInizialized -> Entering function."); }
                            if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotter -> onProductStorageInitialized -> onPlotterInizialized -> key = " + pProductCard.product.plotter.devTeam + "-" + pProductCard.product.plotter.codeName + "-" + pProductCard.product.plotter.moduleName); }

                            try {
                                //plotter.positionAtDatetime(INITIAL_DATE);
                            } catch (err) {
                                // If the plotter does not implement this function its ok.
                            } 

                            let productPlotter = {
                                productCard: pProductCard,
                                plotter: plotter,
                                storage: storage,
                                profile: undefined,
                                notes: undefined
                            };

                            /* Let the Plotter listen to the event of Cursor Files loaded, so that it can reack recalculating if needed. */

                            storage.eventHandler.listenToEvent('Daily File Loaded', plotter.onDailyFileLoaded);

                            /* Lets load now this plotter panels. */

                            productPlotter.panels = [];

                            for (let i = 0; i < pProductCard.product.plotter.module.panels.length; i++) {

                                let panelConfig = pProductCard.product.plotter.module.panels[i];

                                let parameters = {
                                    devTeam: pProductCard.product.plotter.devTeam,
                                    plotterCodeName: pProductCard.product.plotter.codeName,
                                    moduleCodeName: pProductCard.product.plotter.moduleName,
                                    panelCodeName: panelConfig.codeName
                                }

                                let plotterPanelHandle = canvas.panelsSpace.createNewPanel("Plotter Panel", parameters);
                                let plotterPanel = canvas.panelsSpace.getPanel(plotterPanelHandle);

                                /* Connect Panel to the Plotter via an Event. */

                                if (panelConfig.event !== undefined) {

                                    productPlotter.plotter.container.eventHandler.listenToEvent(panelConfig.event, plotterPanel.onEventRaised);

                                }

                                productPlotter.panels.push(plotterPanelHandle);
                            }

                            /* Create The Profie Picture FloatingObject */

                            if (productPlotter.plotter.payload !== undefined) {

                                let imageId = pProductCard.bot.devTeam + "." + pProductCard.bot.profilePicture;

                                productPlotter.plotter.payload.profile.upLabel = pProductCard.product.shortDisplayName;
                                productPlotter.plotter.payload.profile.downLabel = pProductCard.bot.displayName;
                                productPlotter.plotter.payload.profile.imageId = imageId;

                                canvas.floatingSpace.profileBalls.createNewProfileBall(productPlotter.plotter.payload, onProfileBallCreated)

                                function onProfileBallCreated(err, pProfileHandle) {

                                    productPlotter.profile = pProfileHandle;

                                    /* There is no policy yet of what to do if this fails. */
                                }

                                /* Create the Text Notes */

                                canvas.floatingSpace.noteSets.createNoteSet(productPlotter.plotter.payload, productPlotter.plotter.container.eventHandler, onNoteSetCreated);

                                function onNoteSetCreated(err, pNoteSetHandle) {

                                    productPlotter.noteSet = pNoteSetHandle;

                                    /* There is no policy yet of what to do if this fails. */
                                }
                            }

                            /* Add the new Active Protter to the Array */

                            productPlotters.push(productPlotter);

                            callBack(GLOBAL.DEFAULT_OK_RESPONSE);

                        } catch (err) {

                            if (ERROR_LOG === true) { logger.write("[ERROR] initializeProductPlotter -> onProductStorageInitialized -> onPlotterInizialized -> err = " + err); }
                            callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
                        }
                    }

                } catch (err) {

                    if (ERROR_LOG === true) { logger.write("[ERROR] initializeProductPlotter -> onProductStorageInitialized -> err = " + err); }
                    callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
                }
            }

        } catch (err) {

            if (ERROR_LOG === true) { logger.write("[ERROR] initializeProductPlotter -> err = " + err); }
            callBack(GLOBAL.DEFAULT_FAIL_RESPONSE);
        }
    }

    function onProductCardStatusChanged(pProductCard) {

        if (INFO_LOG === true) { logger.write("[INFO] onProductCardStatusChanged -> Entering function."); }

        if (pProductCard.status === PRODUCT_CARD_STATUS.LOADING) {

            /* Lets see if we can find the Plotter of this card on our Active Plotters list, other wise we will initialize it */

            let found = false;

            for (let i = 0; i < productPlotters.length; i++) {

                if (productPlotters[i].productCard.code === pProductCard.code) {

                    found = true;

                }

            }

            if (found === false) {

                initializeProductPlotter(pProductCard, onProductPlotterInitialized);

                function onProductPlotterInitialized(err) {

                    if (INFO_LOG === true) { logger.write("[INFO] initializeProductPlotters -> onProductPlotterInitialized -> Entering function."); }

                    /* There is no policy yet of what to do if this fails. */

                }
            }
        }

        if (pProductCard.status === PRODUCT_CARD_STATUS.OFF) {

            /* If the plotter of this card is on our Active Plotters list, then we remove it. */

            for (let i = 0; i < productPlotters.length; i++) {

                if (productPlotters[i].productCard.code === pProductCard.code) {

                    if (productPlotters[i].profile !== undefined) {

                        canvas.floatingSpace.profileBalls.destroyProfileBall(productPlotters[i].profile);

                    }

                    /* Destroyd the Note Set */

                    canvas.floatingSpace.noteSets.destroyNoteSet(productPlotters[i].noteSet);

                    /* Then the panels. */

                    for (let j = 0; j < productPlotters[i].panels.length; j++) {

                        canvas.panelsSpace.destroyPanel(productPlotters[i].panels[j]);

                    }

                    /* Finally the Storage Objects */

                    productPlotters[i].storage.finalize();

                    productPlotters.splice(i, 1); // Delete item from array.

                }
            }
        }
    }

    function onZoomChanged(event) {

        if (INFO_LOG === true) { logger.write("[INFO] onZoomChanged -> Entering function."); }

        if (initializationReady === true) {

            level = event.newLevel; // for debugging purposes only

            let currentTimePeriod = timePeriod;

            timePeriod = recalculatePeriod(event.newLevel);

            /* If the period changes, we need to spread the word in cascade towards all the depending objects. */

            if (timePeriod !== currentTimePeriod) {

                for (let i = 0; i < productPlotters.length; i++) {

                    let productPlotter = productPlotters[i];

                    productPlotter.productCard.setTimePeriod(timePeriod);
                    productPlotter.storage.setTimePeriod(timePeriod);
                    productPlotter.plotter.setTimePeriod(timePeriod);
                    
                }

                for (let i = 0; i < competitionPlotters.length; i++) {

                    let competitionPlotter = competitionPlotters[i];

                    competitionPlotter.plotter.setTimePeriod(timePeriod);

                }
            }

            recalculateCurrentDatetime();

            saveUserPosition(thisObject.container, timeLineCoordinateSystem);

        }
    }

    function onDragFinished() {

        if (INFO_LOG === true) { logger.write("[INFO] onDragFinished -> Entering function."); }

        if (initializationReady === true) {

            if (thisObject.container.frame.isInViewPort()) {

                saveUserPosition(thisObject.container, timeLineCoordinateSystem);

            }

            if (thisObject.container.frame.isInViewPort() && tooSmall() === false) {



            }
        }
    }

    function onOffsetChanged() {

        if (INFO_LOG === true) { logger.write("[INFO] onOffsetChanged -> Entering function."); }

        if (initializationReady === true) {

            if (thisObject.container.frame.isInViewPort()) {

                recalculateCurrentDatetime();

            }
        }

    }

    function recalculateCurrentDatetime() {

        if (INFO_LOG === true) { logger.write("[INFO] recalculateCurrentDatetime -> Entering function."); }

        /*

        The view port was moved or the view port zoom level was changed and the center of the screen points to a different datetime that me
        must calculate.

        */

        let center = {
            x: (viewPort.visibleArea.bottomRight.x - viewPort.visibleArea.bottomLeft.x) / 2,
            y: (viewPort.visibleArea.bottomRight.y - viewPort.visibleArea.topRight.y) / 2
        };

        center = unTransformThisPoint(center, thisObject.container);
        center = timeLineCoordinateSystem.unInverseTransform(center, thisObject.container.frame.height);

        let newDate = new Date(0);
        newDate.setUTCSeconds(center.x / 1000);

        datetime = newDate;

        for (let i = 0; i < productPlotters.length; i++) {

            let productPlotter = productPlotters[i];

            productPlotter.productCard.setDatetime(datetime);
            productPlotter.storage.setDatetime(datetime);
            productPlotter.plotter.setDatetime(datetime);
           
        }

        for (let i = 0; i < competitionPlotters.length; i++) {

            let competitionPlotter = competitionPlotters[i];

            competitionPlotter.plotter.setDatetime(datetime);

        }

        thisObject.container.eventHandler.raiseEvent("Datetime Changed", datetime);
  
    }

    function getContainer(point) {

        if (INFO_LOG === true) { logger.write("[INFO] getContainer -> Entering function."); }

        let container;

        /* First we check if this point is inside this space. */

        if (this.container.frame.isThisPointHere(point) === true) {

            // return this.container;    Currently there is a BUG in which if this is enabled the datetime of the control panel is not recalculated.

        } else {

            /* This point does not belong to this space. */

            return undefined;
        }

    }

    function setDatetime(pDatetime) {

        if (INFO_LOG === true) { logger.write("[INFO] setDatetime -> Entering function."); }

        /* This function is used when the time is changed through the user interface, but without zooming or panning. */
        /* No matter if the day changed or not, we need to inform all visible Plotters. */

        if (thisObject.container.frame.isInViewPort()) {

            for (let i = 0; i < productPlotters.length; i++) {

                let productPlotter = productPlotters[i];

                productPlotter.productCard.setDatetime(pDatetime);
                productPlotter.storage.setDatetime(pDatetime);
                productPlotter.plotter.setDatetime(pDatetime);

                /* The time has changed, but the viewPort is still on the same place, so we request any of the plotters to reposition it. */

                if (productPlotter.plotter.positionAtDatetime !== undefined) {
                    productPlotter.plotter.positionAtDatetime(pDatetime);
                }

            }

            for (let i = 0; i < competitionPlotters.length; i++) {

                let competitionPlotter = competitionPlotters[i];

                competitionPlotter.plotter.setDatetime(datetime);

            }
        }
    }

    function recalculateScale() {

        if (INFO_LOG === true) { logger.write("[INFO] recalculateScale -> Entering function."); }

        let minValue = {
            x: EARLIEST_DATE.valueOf(),
            y: 0
        };

        let maxValue = {
            x: MAX_PLOTABLE_DATE.valueOf(),
            y: nextPorwerOf10(USDT_BTC_HTH) / 4
        };


        timeLineCoordinateSystem.initialize(
            minValue,
            maxValue,
            thisObject.container.frame.width,
            thisObject.container.frame.height
        );

    }

    function tooTiny() {

        if (INTENSIVE_LOG === true) { logger.write("[INFO] tooTiny -> Entering function."); }

        if (viewPort.zoomLevel < Math.trunc(-28.25 * 100) / 100) {
            return true;
        } else {
            return false;
        }

    }

    function tooSmall() {

        if (INFO_LOG === true) { logger.write("[INFO] tooSmall -> Entering function."); }

        if (viewPort.zoomLevel < Math.trunc(-27.25 * 100) / 100) {
            return true;
        } else {
            return false;
        }

    }

    function draw() {

        if (INTENSIVE_LOG === true) { logger.write("[INFO] draw -> Entering function."); }

        if (productPlotters === undefined) { return; } // We need to wait

        if (thisObject.container.frame.isInViewPort()) {

            this.container.frame.draw();

            drawBackground();

            chartGrid.draw(thisObject.container, timeLineCoordinateSystem);

            /* First the Product Plotters. */

            for (let i = 0; i < productPlotters.length; i++) {

                let productPlotter = productPlotters[i];
                productPlotter.plotter.draw();

            }

            /* Then the competition plotters. */

            for (let i = 0; i < competitionPlotters.length; i++) {

                let competitionPlotter = competitionPlotters[i];
                competitionPlotter.plotter.draw();
            }
        }
    }

    function drawBackground() {

        if (INTENSIVE_LOG === true) { logger.write("[INFO] drawBackground -> Entering function."); }

        let targetLabelFontSize = 150;
        let fontSizeIncrement = 12.5;
        let currentFontSize = 150;

        let market = markets.get(marketId);
        let label = market.assetA + " " + market.assetB;

        //label = '' + level; // Math.trunc(timePeriod / 1000 / 60); 

        if (tooTiny() === true ) {
            return;
        }

        let topPoint = {
            x: 0,
            y: 0
        };

        let bottomPoint = {
            x: 0,
            y: thisObject.container.frame.height
        };

        topPoint = transformThisPoint(topPoint, thisObject.container);
        bottomPoint = transformThisPoint(bottomPoint, thisObject.container);

        /* We want the label of the market to be always centered in the middle of the screen, unless the upper or lower border of the frame is visible on the screen */

        let point;

        if (targetLabelFontSize !== currentFontSize) {
            if (targetLabelFontSize > currentFontSize) {
                currentFontSize = currentFontSize + fontSizeIncrement;
            } else {
                currentFontSize = currentFontSize - fontSizeIncrement;
            }
        }

        if (topPoint.y > viewPort.visibleArea.topLeft.y || bottomPoint.y < viewPort.visibleArea.bottomRight.y) {

            targetLabelFontSize = 150 / 2;

            point = {
                x: 0,
                y: thisObject.container.frame.height / 2
            };

            point = transformThisPoint(point, thisObject.container);

            point = {
                x: (viewPort.visibleArea.bottomRight.x - viewPort.visibleArea.bottomLeft.x) / 2 - label.length / 2 * currentFontSize * 0.60,
                y: point.y + currentFontSize * 0.60 / 2
            };

        } else {

            targetLabelFontSize = 150;

            point = {
                x: (viewPort.visibleArea.bottomRight.x - viewPort.visibleArea.bottomLeft.x) / 2 - label.length / 2 * currentFontSize * 0.60,
                y: (viewPort.visibleArea.bottomLeft.y - viewPort.visibleArea.topLeft.y) / 2 + currentFontSize * 0.60 / 2
            };

        }

        browserCanvasContext.font = currentFontSize + 'px Courier New';
        browserCanvasContext.fillStyle = 'rgba(75, 86, 235, 0.07)';
        browserCanvasContext.fillText(label, point.x, point.y);

    }

    function moveViewPortToCurrentDatetime() {

        if (INFO_LOG === true) { logger.write("[INFO] moveViewPortToCurrentDatetime -> Entering function."); }

        let targetPoint = {
            x: datetime.valueOf(),
            y: 0  // we wont touch the y axis here.
        };

        /* Lets put this point in the coordinate system of the viewPort */

        targetPoint = timeLineCoordinateSystem.transformThisPoint(targetPoint);
        targetPoint = transformThisPoint(targetPoint, thisObject.container);

        /* Lets get the point on the viewPort coordinate system of the center of the visible screen */

        let center = {
            x: (viewPort.visibleArea.bottomRight.x - viewPort.visibleArea.bottomLeft.x) / 2,
            y: (viewPort.visibleArea.bottomRight.y - viewPort.visibleArea.topRight.y) / 2
        };

        /* Lets calculate the displace vector, from the point we want at the center, to the current center. */

        let displaceVector = {
            x: center.x - targetPoint.x,
            y: 0
        };

        viewPort.displace(displaceVector);
    }
}

