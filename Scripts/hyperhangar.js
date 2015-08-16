this.name           = "HyperspaceHangar";
this.author         = "Kenji Takashima";
this.copyright      = "(C) 2015 Kenji Takashima.";
this.licence        = "CC-BY-NC-SA 3.0";
this.description    = "Provides a hangar for your ships across the stars.";

"use strict";

//Defaults
this._defaultpriceOption = 250000;
this._defaulttimeOption = 1800;
//OXPConfig related options
this._showOptions = false;
this._percentPrice = false;
this._shipPercent = 1;
this.oxpcSettings = {
    Info: {Name: this.name, Display: "Hyperspace Hangar", InfoB:
	   "Select Options. Changing price and time options is disabled" +
	   " by default. Percent price is a relatively new option. You will" +
	   " be charged the percentage of your ship price selected.", InfoS:
	   "Change the percentage charged for percent price. Each unit is " +
	   "10%."},
    Bool0: {Name: "_showOptions", Def: false, Desc:
	    "Show price and time options. Def: false"},
    Bool1: {Name: "_percentPrice", Def: false, Desc:
	    "Enables pricing based off ship price percentage."},
    SInt0: {Name: "_shipPercent", Def: 1, Max: 10, Desc:
	    "Percent to charge."}
};

this.startUpComplete = function()
{
    //first time setup
    if (!missionVariables.hyperSpace_namesStored)
    { 
	missionVariables.hyperSpace_namesStored = JSON.stringify({"1_EXIT":
							     "EMPTY"}); 
	missionVariables.hyperSpace_shipsStored = JSON.stringify({});
	missionVariables.hyperSpace_priceOption = this._defaultpriceOption;
	missionVariables.hyperSpace_timeOption = this._defaulttimeOption;
    }
    //mission setup
    if (!missionVariables.hyperSpace_mission)
    {
	missionVariables.hyperSpace_mission = "NOT_ACTIVATED";
    }
    //is OXPconfig installed?
    this._oxpConf_check = true;
    if (!worldScripts["OXPConfig.js"])
    {
	this._oxpConf_check = false;
	this._showOptions = false;
	this._percentPrice = false;
    }
   
    //names of ships stored. Used because _shipsStored would give JSON strings
    this._currentNames = JSON.parse(missionVariables.hyperSpace_namesStored);
   
    //values of ships stored.
    this._shipsStored = JSON.parse(missionVariables.hyperSpace_shipsStored);

    //constants for tests
    this._playerCredit = player.credits;
    this._shipPrice = 0;
    this._actuallyBought = 0;
    this._delay = false;


    //current stored ship value; very important
    this._shipTempKey = 0;

    //self explanatory
    this._oldChoice = 0;
    
    //current prices and storage time
    this._priceOption =  missionVariables.hyperSpace_priceOption;
    this._timeOption = missionVariables.hyperSpace_timeOption;

    //information for the transfer function
    this._oldShips = [];
    this._arrivalTime = {};

    //compatibility with Xenon UI
    var w = worldScripts.XenonUI;
    if (w) w.$addMissionScreenException("HyperspaceHangar");
   
    this.$dockedCheck();
}

this.shipDockedWithStation = function()
{
    
    this.$dockedCheck();
}

//mark mission system if in G6 and mission has been given
this.playerEnteredNewGalaxy = function()
{
    if (galaxyNumber == 5 && missionVariables.hyperSpace_mission == "DELIVER")
    {
	mission.markSystem({
	    system: 149,
	    name: "hyperspaceMission",
	    markerColor: "greenColor",
	    markerScale: 1.5,
	    markerShape: "MARKER_DIAMOND"
	});
    }
}

//save variables for next time
this.playerWillSaveGame = function()
{
    missionVariables.hyperSpace_namesStored =
	JSON.stringify(this._currentNames);
    missionVariables.hyperSpace_shipsStored = JSON.stringify(this._shipsStored);
    missionVariables.hyperSpace_priceOption = this._priceOption;
    missionVariables.hyperSpace_timeOption = this._timeOption;
}

//create hangar interface if docked.
this.$dockedCheck = function()
{      
    if (player.ship.docked && player.ship.dockedStation.hasShipyard)
    {
	player.ship.dockedStation.setInterface("HyperSpace",
					       { title: "Hyperspace Hangar",
						 category: "Services",
						 summary: "Stores ships.",
						 callback:
						 this.$storeShips.bind(this) });
    }
}

this.guiScreenChanged = function(to, from)
{
    //store player's ship if replacement is a possibility.
    if (guiScreen == "GUI_SCREEN_SHIPYARD")
    {
	this._shipTempKey = clock.absoluteSeconds;
	this._shipsStored[this._shipTempKey] =
	    worldScripts["Ship_Storage_Helper.js"].storeCurrentShip();
	this._currentNames[this._shipTempKey] = player.ship.displayName;
	this._shipPrice = player.ship.price;
	this._playerCredit = player.credits;
	this._actuallyBought = 1;
    }

    else
    {
	//has a ship been bought?
	if (from == "GUI_SCREEN_SHIPYARD" && clock.isAdjusting)
	{
	    this._delay = true;
	    return;
	}
	else if (this._delay == false)
	{
	    delete this._shipsStored[this._shipTempKey];
	    delete this._currentNames[this._shipTempKey];
	}
	else if (this._shipTempKey == null)
	{
	    this._delay = false;
	}
    }
}

//Activate hangar.
this.playerBoughtNewShip = function(ship, price)
{
    player.credits = this._playerCredit - price;
    if (player.credits >= this._priceOption * 0.1
	&& this._actuallyBought == 1) 
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    model: "[" + JSON.parse(this._shipsStored[this._shipTempKey])[1]
		+ "]", 
	    spinModel: true,
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
		     height: 480},
	    title: "Hyperspace Hangar",
	    message: "Store ship?",
	    choicesKey: "hyperSpace_askstore"},
	//storing a ship costs time and money, removing handwavium.
	//moved to this location to ensure price can be used as 
	//a parameter.
	this.$askStore = function(choice)
	{
	    if (choice == "1_STORE")
	    {
		if (player.credits >= this._priceOption * 0.1)
		{
		    player.consoleMessage("Stored " +
					  this._currentNames[this._shipTempKey]
					  + ".");
		    //don't delete stored ship
		    this._shipTempKey = null;
		    //activate hangar
		    this._currentNames["1_EXIT"] = "Exit.";
		    //if using percent price
		    if (this._percentPrice == true)
		    {
			player.credits = player.credits - (this._shipPrice *
							  (this.shipPercent *
							   0.1));
		    }
		    else if (missionVariables.hyperSpace_mission != "COMPLETE")
		    {	
			player.credits = player.credits - this._priceOption *
			    0.1;
		    }
		    else
		    {
			player.credits = player.credits - this._priceOption *
			    0.05;
		    }
		    clock.addSeconds(this._timeOption);
		}
	    }
	    else
	    {
		this._delay = false;
			delete this._shipsStored[this._shipTempKey];
		delete this._currentNames[this._shipTempKey];
	    }
	})
	if (this._percentPrice == true)
	{
	    mission.addMessageText("Current price: " +
				   (this._shipPrice * (this.shipPercent * 0.1))
				   + " Cr.");
	}
	else if (missionVariables.hyperSpace_mission != "COMPLETE")
	{
	    mission.addMessageText("Current price: " +
				   this._priceOption / 10 + " Cr.");
	}
	else
	{
	    mission.addMessageText("Current price: " +
				   this._priceOption / 20 + " Cr.");
	}
	mission.addMessageText("Current storage time: " +
			       this._timeOption / 60 + " Minutes.");
    }
    else
    {
        this._delay = false;
	delete this._shipsStored[this._shipTempKey];
	delete this._currentNames[this._shipTempKey];
    }
    this._actuallyBought = 0;
}

//hangar function proper
this.$storeShips = function()
{
    //are options available?
    if (this._showOptions == false)
    {
	if (this._oxpConf_check != false)
	{
	    player.consoleMessage("Options are available through OXPConfig.");
	}
	else
	{
	    player.consoleMessage("OXPConfig not enabled/installed. " +
				  "Cannot provide options.");
	}
    }
    //deactivate hangar is empty
    if (Object.keys(this._currentNames) == "1_EXIT")
    {
	this._currentNames["1_EXIT"] = "EMPTY";
    }
    //offer mission
    if (galaxyNumber == 2 && missionVariables.hyperSpace_mission ==
	"NOT_ACTIVATED")
    {
	missionVariables.hyperSpace_mission = "ACTIVATED"
    }
    //not activated unless another ship is bought
    if (this._currentNames["1_EXIT"] == "EMPTY")
    {
	if (this._showOptions == false)
	{
	player.consoleMessage("You must purchase an additional ship in order "
			       + "to use the hangar.");
	}
	else
	{
	    mission.runScreen({
		screenID: "HyperspaceHangar",
		background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			     height: 480},
		allowInterrupt: true,
		title: "Hyperspace Hangar",
		message: "No ships stored.",
		choicesKey: "hyperSpace_notstored"},
			      this.$noneStored);
	    mission.addMessageText("You must purchase an additional ship in " +
				   "order to use the hangar.");
	}
    }
    //no options
    else if (this._showOptions == false)
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Choose an option.",
	    choicesKey: "hyperSpace_nooptions"},
			  this.$choice);
    }
    //options
    else
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Choose an option.",
	    choicesKey: "hyperSpace_choices"},
			  this.$choice);
    }
}

//menu function, used for almost every main menu, exepting no ships
this.$choice = function(choice)
{
    if (choice == "GARAGE_1_SWITCH")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Choose a ship.",
	    choices: this._currentNames},
			  this.$choice_switch);
	mission.addMessageText("Current storage time: " +
                (this._timeOption / 60) + " Minutes.");
	
    }
    
    else if (choice == "GARAGE_2_SELL")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Choose an option.",
	    choicesKey: "hyperSpace_sellChoices"},
			  this.$choice_sell);
	mission.addMessageText("WARNING: ALL SOLD SHIPS WILL BE" +
			       "PERMANENTLY LOST.");
	
    }
    else if (choice == "GARAGE_3_TRANSFER")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Choose an option.",
	    choicesKey: "hyperSpace_transferChoices"},
			  this.$choice_transfer);
    }
    else if (choice == "GARAGE_4_OPTIONS")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Choose an option.",
	    choicesKey: "hyperSpace_options"},
			  this.$choice_options);
	mission.addMessageText("Current selling time: " +
			       (this._timeOption / 60) + " Minutes.");
	mission.addMessageText("Current value: " +
			       (this._priceOption * 0.1) + " Cr.");
    }
    else if (choice == "GARAGE_5_INFO")
    {
	//"normal" info screen
	if (missionVariables.hyperSpace_mission != "COMPLETED")
	{
	    mission.runScreen({
		screenID: "HyperspaceHangar",
		title: "Station Database: Norby-Ramen Quirium Accuracy Drive",
		messageKey: "hyperSpace_QAD"});
	}
	//complete info screen
	else if (missionVariables.hyperSpace_mission == "COMPLETED")
	{
	    mission.runScreen({
		screenID: "HyperspaceHangar",
		title: "Station Database: Norby-Ramen Quirium Accuracy Drive",
		messageKey: "hyperSpace_QAD_authorized",
		choicesKey: "hyperSpace_QAD_nextPage"},
			     this.$info_next_page);
	}
    }
}


this.$choice_switch = function(choice)
{
    //give chance to exit. ditto for sell function.
    if (choice == "1_EXIT")
    {
	return;
    }
    else if (system.ID != JSON.parse(this._shipsStored[choice])[0][1])
    {
	player.consoleMessage("Ship not in hangar. " +
			   "Transfer ship first to switch.");
	return;
    }
    this._oldChoice = choice;
    //confirm choice with possible damage
    if (player.ship.dockedStation.equivalentTechLevel < 7 &&
	missionVariables.hyperSpace_mission != "COMPLETE")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    title: "Hyperspace Hangar",
	    message: "Transfering at the currently docked station may be " +
		"damaging. Continue anyway?",
	    choicesKey: "hyperSpace_confirm"},
			  this.$choice_confirm_damage);
    }
    //confirm choice
    else
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    model: "[" + JSON.parse(this._shipsStored[choice])[1] + "]", 
	    spinModel: true,	
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480}, 
	    title: "Hyperspace Hangar",
	    message: "Switch ship to " + this._currentNames[choice] + "?",
	    choicesKey: "hyperSpace_confirm"},
			  this.$choice_confirm_switch);
    }
}

//sell menus
this.$choice_sell = function(choice)
{
    if (choice == "1_SELLCURRENT")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Choose a ship to sell.",
	    choices: this._currentNames},
			  this.$choice_sell_sub1);
    }
    else if (choice == "2_SELLSTORED")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Choose a ship to sell.",
	    choices: this._currentNames},
			  this.$choice_sell_sub2);
    }
}

this.$choice_sell_sub1 = function(choice)
{
    //don't sell your options!
    if (choice == "1_EXIT")
    {
	return;
    }
    this._oldChoice = choice;
    mission.runScreen({
	screenID: "HyperspaceHangar",
	model: "[" + player.ship.dataKey + "]", 
	spinModel: true,
	background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
		     height: 480},	
	title: "Hyperspace Hangar",
	message: "Sell " + player.ship.displayName + "?",
	choicesKey: "hyperSpace_confirm"},
		      this.$choice_confirm_sell1);
}
	
this.$choice_sell_sub2 = function(choice)
{
    //don't sell your options!
    if (choice == "1_EXIT")
    {
	return;
    }
    this._oldChoice = choice;
    mission.runScreen({
	screenID: "HyperspaceHangar",
	model: "[" + JSON.parse(this._shipsStored[choice])[1] + "]", 
	spinModel: true,
	background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
		     height: 480},	
	allowInterrupt: true,
	title: "Hyperspace Hangar",
	message: "Sell " + this._currentNames[choice] + "?",
	choicesKey: "hyperSpace_confirm"},
		      this.$choice_confirm_sell2);
}

//transfer menu
this.$choice_transfer = function(choice)
{
    if (choice == "1_SEND")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			     height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Choose a ship to send to the location currently " + 
		"marked on the map.",
	    choices: this._currentNames},
			  this.$choice_transfer_send);
    }
    else if (choice == "2_ORDER")
    {
	
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			     height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Have a ship sent to the docked station.",
	    choices: this._currentNames},
			  this.$choice_transfer_order);
    }
}
 
this.$choice_transfer_send = function(choice)
{
    this._oldChoice = choice;
    this._oldShips = JSON.parse(this._shipsStored[choice]);
    //redundancy check
    if (player.ship.targetSystem == JSON.parse(this._shipsStored[choice])[0][1])
    {
	player.consoleMessage("Your ship is already at the selected station.");
	return;
    }
    //galaxy consistency check
    else if (this._oldShips[0][0] != galaxyNumber)
    {
	player.consoleMessage("Your ship is in another galaxy. Please order " +
			      "instead.");
	return;
    }
    //is the short range chart usable?
    if (System.infoForSystem(this._oldShips[0][0], this._oldShips[0][1]).distanceToSystem(System.infoForSystem(galaxyNumber, player.ship.targetSystem)) <= 7.0
	&& this._oldShips[0][0] == galaxyNumber)
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    model: "[" + this._oldShips[1] + "]", 
	    spinModel: true,
	    backgroundSpecial: "SHORT_RANGE_CHART",
	    title: "Hyperspace Hangar",
	    message: "Transfer " + this._currentNames[choice] + " from " +
		JSON.parse(this._shipsStored[choice])[0][4] + " to " +
		System.infoForSystem(galaxyNumber,
				     player.ship.targetSystem).name
		+ "?",
	    choicesKey: "hyperSpace_confirm"},
			  this.$choice_confirm_transfer_send);
    }
    //what mode is the map in?
    else if (player.ship.routeMode != "OPTIMIZED_BY_TIME" )
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    model: "[" + this._oldShips[1] + "]", 
	    spinModel: true,
	    backgroundSpecial: "LONG_RANGE_CHART_SHORTEST",
	    title: "Hyperspace Hangar",
	    message: "Transfer " + this._currentNames[choice] + " from " +
		JSON.parse(this._shipsStored[choice])[0][4] + " to " +
		System.infoForSystem(galaxyNumber,
				     player.ship.targetSystem).name
		+ "?",
	    choicesKey: "hyperSpace_confirm"},
			  this.$choice_confirm_transfer_send);
    }
    else if (player.ship.routeMode == "OPTIMIZED_BY_TIME")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    model: "[" + this._oldShips[1] + "]", 
	    spinModel: true,
	    backgroundSpecial: "LONG_RANGE_CHART_QUICKEST",
	    title: "Hyperspace Hangar",
	    message: "Transfer " + this._currentNames[choice] + " from " +
		JSON.parse(this._shipsStored[choice])[0][4] + " to " +
		System.infoForSystem(galaxyNumber,
				     player.ship.targetSystem).name
		+ "?",
	    choicesKey: "hyperSpace_confirm"},
			  this.$choice_confirm_transfer_send);
    }
    mission.addMessageText("Current transfer price: " +
			   System.infoForSystem(this._oldShips[0][0], this._oldShips[0][1]).routeToSystem(System.infoForSystem(galaxyNumber, player.ship.targetSystem)).distance * 90 + " Cr.");
}

this.$choice_transfer_order = function(choice)
{
    this._oldChoice = choice;
    this._oldShips = JSON.parse(this._shipsStored[choice]);
    //redundancy check
    if (this._oldShips[0][1] == system.ID)
    {
	player.consoleMessage("Ship already present.");
	return;
    }
    //intergalactic order 
    else if (this._oldShips[0][0] != galaxyNumber)
    {
	mission.runScreen({
	screenID: "HyperspaceHangar",
	model: "[" + this._oldShips[1] + "]", 
	spinModel: true,
	background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
		     height: 480}, 
	title: "Hyperspace Hangar",	
	message: "Transfer " + this._currentNames[choice] + " to " +
		"Galaxy " + (galaxyNumber + 1) + "?",
	choicesKey: "hyperSpace_confirm"},
			  this.$choice_confirm_transfer_order_interGalactic);
	mission.addMessageText("Current location: " +
			   System.infoForSystem(this._oldShips[0][0],
						this._oldShips[0][1]).name +
			   ".");
	mission.addMessageText("Current order cost: " +
			       Math.abs(galaxyNumber - this._oldShips[0][0]) *
			       1000 + " Cr.");
	mission.addMessageText("Current shipping time: " +
			       Math.abs(galaxyNumber - this._oldShips[0][0]) *
			       72 + " hours.");
    }
    //regular order
    else
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    model: "[" + this._oldShips[1] + "]", 
	    spinModel: true,
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480}, 
	    title: "Hyperspace Hangar",	
	    message: "Transfer " + this._currentNames[choice] + " to " +
		system.name + "?",
	    choicesKey: "hyperSpace_confirm"},
			  this.$choice_confirm_transfer_order);
    
	mission.addMessageText("Current location: " +
			       System.infoForSystem(this._oldShips[0][0],
						    this._oldShips[0][1]).name +
			       ".");
	mission.addMessageText("Current order cost: " + system.info.routeToSystem(System.infoForSystem(this._oldShips[0][0], this._oldShips[0][1]), player.ship.routeMode).distance * 90 + " Cr.");
	mission.addMessageText("Current shipping time: " + system.info.routeToSystem(System.infoForSystem(this._oldShips[0][0], this._oldShips[0][1]), player.ship.routeMode).time + " hours.");
    }
}
    
this.$choice_options = function(choice)
{
    if (choice == "1_PRICE")
    {
	if (this._percentPrice == true)
	{
	    player.consoleMessage("Standard pricing disabled. " +
				  "Check OXPConfig. Current value: " +
				  this._shipPercent * 10 + "%.");
	}
	else
	{
	    mission.runScreen({
		screenID: "HyperspaceHangar",
		background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			     height: 480},
		allowInterrupt: true,
		title: "Hyperspace Hangar",
		message: "Input price",
		textEntry: "TRUE"},
			      this.$choice_price);
	    mission.addMessageText("Current value: " +
				   (this._priceOption / 10) + " Cr.");
	}
    }
    else if (choice == "2_TIME")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Input time (in seconds)",
	    textEntry: "TRUE"},
			  this.$choice_time);
	mission.addMessageText("Current value: " + (this._timeOption / 60) +
			  " Minutes.");
    }
    else if (choice == "3_RESET")
    {
	this._priceOption = this._defaultpriceOption;
	this._timeOption = this._defaulttimeOption;
    }
    //removes ships entirely
    else if (choice == "4_PURGE")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Choose ship to remove. WARNING: REMOVAL IS PERMANENT!",
	    choices: this._currentNames},
			  this.$purge);
    }
}

this.$choice_price = function(choice)
{
    this._priceOption = choice * 10;
}

this.$choice_time = function(choice)
{
    this._timeOption = choice;
}

this.$purge = function(choice)
{
    this._oldChoice = choice;
    mission.runScreen({
	screenID: "HyperspaceHangar",
	model: "[" + JSON.parse(this._shipsStored[choice])[1] + "]", 
	spinModel: true,
	background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
		     height: 480},
	title: "Hyperspace Hangar",
	message: "Remove " + this._currentNames[choice] + "?",
	choicesKey: "hyperSpace_confirm"},
		      this.$choice_confirm_purge);
}

//menu for no ships
this.$noneStored = function(choice)
{
    if (choice == "1_OPTIONS")
    {
	mission.runScreen({
	    screenID: "HyperspaceHangar",
	    background: {name: "launch_bay_wip5_by_kheng-d7fmvuj.png",
			 height: 480},
	    allowInterrupt: true,
	    title: "Hyperspace Hangar",
	    message: "Choose an option.",
	    choicesKey: "hyperSpace_options"},
			  this.$choice_options);
    }
    else if (choice == "2_INFO")
    {
	if (missionVariables.hyperSpace_mission != "COMPLETED")
	{
	    mission.runScreen({
		screenID: "HyperspaceHangar",
		title: "Station Database: Norby-Ramen Quirium Accuracy Drive",
		messageKey: "hyperSpace_QAD"});
	}
	else if (missionVariables.hyperSpace_mission == "COMPLETED")
	{
	    mission.runScreen({
		screenID: "HyperspaceHangar",
		title: "Station Database: Norby-Ramen Quirium Accuracy Drive",
		messageKey: "hyperSpace_QAD_authorized",
		choices: ({"1_NEXT": "Next page"})},
			      this.$info_next_page);
	}
    }
}

this.$choice_confirm_switch = function(choice)
{
    if (choice == "1_YES" )
    {
	//switch ships
	this._shipsStored[clock.absoluteSeconds] =
	    worldScripts["Ship_Storage_Helper.js"].storeCurrentShip();
	this._currentNames[clock.absoluteSeconds] = player.ship.displayName;
	worldScripts["Ship_Storage_Helper.js"].restoreStoredShip(this._shipsStored[this._oldChoice]);
	
	//don't keep switched ship stored!
	player.consoleMessage("Switched ship to " +
			      this._currentNames[this._oldChoice] + ".");
	delete this._shipsStored[this._oldChoice];
	delete this._currentNames[this._oldChoice];
	clock.addSeconds(this._timeOption);
    }
}

this.$choice_confirm_damage = function(choice)
{
    if (choice == "1_YES")
    {
	//switch ships
	this._shipsStored[clock.absoluteSeconds] =
	    worldScripts["Ship_Storage_Helper.js"].storeCurrentShip();
	this._currentNames[clock.absoluteSeconds] = player.ship.displayName;
	worldScripts["Ship_Storage_Helper.js"].restoreStoredShip(this._shipsStored[this._oldChoice]);
	
	//don't keep switched ship stored!
	player.consoleMessage("Switched ship to " +
			      this._currentNames[this._oldChoice] + ".");
	delete this._shipsStored[this._oldChoice];
	delete this._currentNames[this._oldChoice];
	clock.addSeconds(this._timeOption);
	
	//possibly damage ship
	player.ship.takeInternalDamage();
	if (player.ship.takeInternalDamage() == true)
	{
		player.consoleMessage("Ship damaged.");
	}
    }
}

this.$choice_confirm_sell1 = function(choice)
{
    if (choice == "1_YES")
    {
	//"sell" ship
	player.credits = player.credits + (player.ship.price * .75);
	worldScripts["Ship_Storage_Helper.js"].restoreStoredShip(this._shipsStored[this._oldChoice]);
	player.consoleMessage("Sold " + this._currentNames[this._oldChoice]
			      + ".");
	delete this._shipsStored[this._oldChoice];
	delete this._currentNames[this._oldChoice];
	clock.addSeconds(this._timeOption);
    }
}

this.$choice_confirm_sell2 = function(choice)
{
    if (choice == "1_YES")
    {
	//store ship
	this._shipsStored[clock.absoluteSeconds] =
	    worldScripts["Ship_Storage_Helper.js"].storeCurrentShip();
	this._currentNames[clock.absoluteSeconds] = player.ship.displayName;
	this._shipTempKey = clock.absoluteSeconds;
	
	//reload ship for pricing
	worldScripts["Ship_Storage_Helper.js"].restoreStoredShip(this._shipsStored[choice]);
	player.credits = player.credits + (player.ship.price * .75);
	player.consoleMessage("Sold " + this._currentNames[this._oldChoice]
			      + ".");
	delete this._shipsStored[this._oldChoice];
	delete this._currentNames[this._oldChoice];
	
	//reload original ship
	worldScripts["Ship_Storage_Helper.js"].restoreStoredShip(this._shipsStored[this._shipTempKey]);
	delete this._shipsStored[this._shipTempKey];
	delete this._currentNames[this._shipTempKey];
	clock.addSeconds(this._timeOption);
	this._confirm = false;
    }
}

this.$choice_confirm_transfer_send = function(choice)
{
    if (choice == "1_YES")
    {
	this._oldShips = JSON.parse(this._shipsStored[this._oldChoice]);
	//subtract money
	player.credits = player.credits - (System.infoForSystem(this._oldShips[0][0], 
				this._oldShips[0][1]).routeToSystem(System.infoForSystem(galaxyNumber, 
								    player.ship.targetSystem, 
								    player.ship.routeMode)).distance * 90);
	//change values
	this._oldShips[0][0] = galaxyNumber;
	this._oldShips[0][1] = player.ship.targetSystem;
	this._oldShips[0][4] = System.infoForSystem(galaxyNumber,
						    player.ship.targetSystem).name;
	this._shipsStored[this._oldChoice] = JSON.stringify(this._oldShips);
	//give feedback
	player.consoleMessage(this._oldShips[0][3] + " sent to " +
			      System.infoForSystem(this._oldShips[0][0],
						   this._oldShips[0][1]).name +
			      ".");
    }    
}

this.$choice_confirm_transfer_order = function(choice)
{
    if (choice == "1_YES")
    {
	this._oldShips = JSON.parse(this._shipsStored[this._oldChoice]);
	//subtract money
	player.credits = player.credits - system.info.routeToSystem(System.infoForSystem(this._oldShips[0][0], 
											this._oldShips[0][1], 
											player.ship.routeMode)).distance * 90;
	//add time
	clock.addSeconds(system.info.routeToSystem(System.infoForSystem(this._oldShips[0][0], 
									this._oldShips[0][1]), 
									player.ship.routeMode).time * 3600);
	//give feedback
	player.consoleMessage("Got " + this._oldShips[0][3] + " from " +
			      System.infoForSystem(this._oldShips[0][0],
						   this._oldShips[0][1]).name +
			      ".");
	//change values
	this._oldShips[0][0] = galaxyNumber;
	this._oldShips[0][1] = system.ID;
	this._oldShips[0][4] = system.name;
	this._shipsStored[this._oldChoice] = JSON.stringify(this._oldShips);
    }
}

this.$choice_confirm_transfer_order_interGalactic = function(choice)
{
    if (choice == "1_YES")
    {
	//subtract money
	player.credits = player.credits - Math.abs(galaxyNumber -
						   this._oldShips[0][0]) * 900;
	//add time
	clock.addSeconds(Math.abs(galaxyNumber - this._oldShips[0][0]) * 72
			 * 3600);
	//give feedback
	player.consoleMessage("Got " + this._oldShips[0][3] + " from " +
			      System.infoForSystem(this._oldShips[0][0],
						   this._oldShips[0][1]).name +
			      ".");
	//change values
	this._oldShips[0][0] = galaxyNumber;
	this._oldShips[0][1] = system.ID;
	this._oldShips[0][4] = system.name;
	this._shipsStored[this._oldChoice] = JSON.stringify(this._oldShips);
    }
}
	
	
	
this.$choice_confirm_purge = function(choice)
{
    if (choice == "1_YES")
    {
	player.consoleMessage("Removed " + this._currentNames[this._oldChoice]
			      + ".");
	delete this._currentNames[this._oldChoice];
	delete this._shipsStored[this._oldChoice];
    }
}

//next page of info for mission completed info screen
this.$info_next_page = function(choice)
{
    mission.runScreen({
	screenID: "HyperspaceHangar",
	title: "Station Database: Norby-Ramen Quirium Accuracy Drive",
	messageKey: "hyperSpace_QAD_authorized2"});
}
