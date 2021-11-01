/* Durch Automation Studio generierte Headerdatei*/
/* Nicht bearbeiten! */
/* Library  */

#ifndef _LIBRARY_
#define _LIBRARY_
#ifdef __cplusplus
extern "C" 
{
#endif

#include <bur/plctypes.h>

#ifndef _BUR_PUBLIC
#define _BUR_PUBLIC
#endif
/* Datentypen und Datentypen von Funktionsblöcken */
typedef struct Type_MotorParameter
{	plcbit Param1;
	unsigned char Param2;
} Type_MotorParameter;

typedef struct Type_MotorCommand
{	plcbit CMD1;
	unsigned char CMD2;
} Type_MotorCommand;

typedef struct Type_Motor
{	struct Type_MotorParameter Param;
	struct Type_MotorCommand Cmd;
} Type_Motor;

typedef struct FB_Motor
{
	/* VAR_INPUT (analog) */
	struct Type_MotorCommand Cmd;
	struct Type_MotorParameter Parameter;
	/* VAR_OUTPUT (analog) */
	unsigned char Status;
	/* VAR_IN_OUT (analog und digital) */
	unsigned char* ErrorCounter;
	/* VAR (analog) */
	unsigned char step;
	/* VAR_INPUT (digital) */
	plcbit Enable;
} FB_Motor_typ;



/* Prototyping of functions and function blocks */
_BUR_PUBLIC void FB_Motor(struct FB_Motor* inst);


#ifdef __cplusplus
};
#endif
#endif /* _LIBRARY_ */

