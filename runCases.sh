echo "Running first case, increment = -5.5"

ts-node index.ts '{"WorkdayStart":{"Hours":8,"Minutes":
0},"WorkdayStop":{"Hours":16,"Minutes":0},"RecurringHolidays":[{"Month":
5,"Day":17}],"Holidays":[{"Year":2004,"Month":5,"Day":
27}],"StartDate":"24-05-2004 18:05","Increment":-5.5}' 



echo "Running second case, increment = 44.723656"

ts-node index.ts '{"WorkdayStart":{"Hours":8,"Minutes":
0},"WorkdayStop":{"Hours":16,"Minutes":0},"RecurringHolidays":[{"Month":
5,"Day":17}],"Holidays":[{"Year":2004,"Month":5,"Day":
27}],"StartDate":"24-05-2004 19:03","Increment":44.723656}' 


echo "Running third case, increment = -6.7470217"

ts-node index.ts '{"WorkdayStart":{"Hours":8,"Minutes":
0},"WorkdayStop":{"Hours":16,"Minutes":0},"RecurringHolidays":[{"Month":
5,"Day":17}],"Holidays":[{"Year":2004,"Month":5,"Day":
27}],"StartDate":"24-05-2004 18:03","Increment":-6.7470217}' 



echo "Running fourth  case, increment = 12.782709"

ts-node index.ts '{"WorkdayStart":{"Hours":8,"Minutes":
0},"WorkdayStop":{"Hours":16,"Minutes":0},"RecurringHolidays":[{"Month":
5,"Day":17}],"Holidays":[{"Year":2004,"Month":5,"Day":
27}],"StartDate":"24-05-2004 08:03","Increment":12.782709}' 


echo "Running fifth  case, increment = 8.276628"

ts-node index.ts '{"WorkdayStart":{"Hours":8,"Minutes":
0},"WorkdayStop":{"Hours":16,"Minutes":0},"RecurringHolidays":[{"Month":
5,"Day":17}],"Holidays":[{"Year":2004,"Month":5,"Day":
27}],"StartDate":"24-05-2004 07:03","Increment":8.276628}' 
