this.name           = "HyperspaceHangar-Mission";
this.author         = "Kenji Takashima";
this.copyright      = "(C) 2015 Kenji Takashima.";
this.licence        = "CC-BY-NC-SA 3.0";
this.description    = "Mission for Hyperspace Hangar.";

"use strict";

this.missionScreenOpportunity = function()
{
    //start mission
    if (missionVariables.hyperSpace_mission == "ACTIVATED")
    {
	mission.runScreen({
	    title: "Message from Ramen Corporation",
	    messageKey: "hyperSpace_missionBegin"});
	missionVariables.hyperSpace_mission = "DELIVER";
	mission.setInstructions("Deliver the Ramen Corporation's documents to" +
				" Diesanen in G6.");
    }
    //end mission
    else if (galaxyNumber == 5 && system.ID == 149 &&
	     missionVariables.hyperSpace_mission == "DELIVER")
    {
	mission.runScreen({
	    title: "Message from Ramen Corporation",
	    messageKey: "hyperSpace_missionEnd"});
	mission.unmarkSystem({
	    system: 149,
	    name: "hyperspaceMission"
	});
	missionVariables.hyperSpace_mission = "DELIVERED";
    }
    //give reward screen
    else if (missionVariables.hyperSpace_mission == "DELIVERED")
    {
	mission.runScreen({
	    title: "Message from Ramen Corporation",
	    messageKey: "hyperSpace_missionReward"});
	missionVariables.hyperSpace_mission = "COMPLETED";
	missionVariables.hyperSpaceTimeCompleted = clock.days;
    }

}
