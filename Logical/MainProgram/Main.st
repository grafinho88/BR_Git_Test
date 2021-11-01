
PROGRAM _INIT
	(* Insert code here *)
	 gSollTemp := 25;
END_PROGRAM

PROGRAM _CYCLIC
	(* Insert code here *)
	MTBasicPT1.Enable := TRUE; 
	MTBasicPT1.Gain := 1;
	MTBasicPT1.TimeConstant := 1;
	MTBasicPT1.In := INT_TO_REAL(gSollTemp);
	MTBasicPT1();
	
	gIstTemp := REAL_TO_INT(MTBasicPT1.Out);
	
	ClientInfo;
	
	
	// Test Drop Down
	gDropDownItems;
	gDropDownSelectedIndex;
	gDropDownSelectedValue;
	
	gIntFromString := STRING_TO_INT(gDropDownSelectedValue);

	
	
	(*******************************************************************
	* Test Style Change
	* Stuff for Zweig 2 
	*******************************************************************)

	visuChangeStyleFromWidget;
	
	visuStyle;
	
	
	
	
	
END_PROGRAM

PROGRAM _EXIT
	(* Insert code here *)
	 
END_PROGRAM

