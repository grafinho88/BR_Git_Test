
TYPE
	Type_MotorParameter : 	STRUCT 
		Param1 : BOOL;
		Param2 : USINT;
	END_STRUCT;
	Type_MotorCommand : 	STRUCT 
		CMD1 : BOOL;
		CMD2 : USINT;
	END_STRUCT;
	Type_Motor : 	STRUCT 
		Param : Type_MotorParameter;
		Cmd : Type_MotorCommand;
	END_STRUCT;
END_TYPE
