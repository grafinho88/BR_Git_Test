
PROGRAM _CYCLIC
	(* Insert code here *)
	 
	//Call Alarm Handler 
	FB_MpAlarmXCore(
		MpLink := ADR(gAlarmXCore),
		Enable := TRUE,
		ErrorReset := cmdErrorReset);
	
	//Call Alarm History Handler
	FB_MpAlarmXHistory(
		MpLink := ADR(gAlarmXHistory),
		Enable := TRUE,
		ErrorReset := cmdErrorReset, 
		DeviceName := ADR('CF'));
	
	
	//Edge Alarme
	IF cmdAlarm1 THEN
		snippet1 := 1;
		MpAlarmXSet(gAlarmXCore, 'Alarm1');
		
		snippet1 := 2;
		MpAlarmXSet(gAlarmXCore, 'Alarm1');
		
		snippet1 := 3;
		MpAlarmXSet(gAlarmXCore, 'Alarm1');
		
		
		cmdAlarm1 := FALSE;
	END_IF;
	
	//Perm
	IF cmdAlarm2 THEN
		cmdAlarm2 := FALSE;
		MpAlarmXSet(gAlarmXCore, 'Alarm2');
		
	END_IF;
	
	IF resetAlarm2 THEN
		resetAlarm2 := FALSE;
		MpAlarmXReset(gAlarmXCore, 'Alarm2');
	END_IF;
	
	
	
	
	
	
	
	
	
	FB_AlarmResetAll(
		MpLink := ADR(gAlarmXCore),
		Enable := TRUE,
		ErrorReset := cmdErrorReset,
		Execute := cmdErrorReset);
	
	cmdErrorReset := FALSE;
	
	
	snippet1;
	

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
END_PROGRAM
