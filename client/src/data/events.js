/**
 * Canonical American Revolution event chronology.
 *
 * Event-level dates, narrative, figures, scope notes, and sources live here.
 * Aggregate series and chart-ready derivations live in metrics.js.
 */
export const events = [
  {
    "id": 101,
    "slug": "stamp-act-congress-meets",
    "date": "1765-10-07",
    "endDate": "1765-10-25",
    "duration": "19 days",
    "year": 1765,
    "title": "Stamp Act Congress Meets",
    "location": "New York City, New York",
    "lat": 40.7074,
    "lng": -74.0104,
    "type": "political",
    "side": "american",
    "facts": [
      {
        "label": "Colonies represented",
        "value": "9 of 13"
      },
      {
        "label": "Delegates",
        "value": "27"
      }
    ],
    "description": "Delegates from nine colonies met to coordinate resistance to Parliament's first direct tax on the colonies. Their Declaration of Rights and Grievances accepted loyalty to the Crown but denied Parliament's right to tax colonists who had no representatives there.",
    "significance": "An early experiment in intercolonial action; the resistance network and constitutional arguments developed here resurfaced in 1774.",
    "source": {
      "label": "National Park Service — Timeline of the Revolution",
      "url": "https://www.nps.gov/subjects/americanrevolution/timeline.htm"
    }
  },
  {
    "id": 102,
    "slug": "boston-massacre",
    "date": "1770-03-05",
    "year": 1770,
    "title": "Boston Massacre",
    "location": "King Street\nBoston, Massachusetts",
    "lat": 42.3588,
    "lng": -71.0578,
    "type": "political",
    "side": "american",
    "facts": [
      {
        "label": "Colonists killed",
        "value": "5"
      },
      {
        "label": "Soldiers tried",
        "value": "8"
      }
    ],
    "description": "After years of friction over taxes and the presence of British troops, soldiers fired into a hostile crowd on King Street, killing five colonists, including Crispus Attucks. Patriot printers turned the clash into a powerful symbol of military occupation; John Adams later defended the soldiers in court.",
    "significance": "Propaganda and public memory transformed a street confrontation into a shared colonial grievance.",
    "source": {
      "label": "National Park Service — Boston Massacre Site",
      "url": "https://www.nps.gov/places/boston-massacre-site.htm"
    }
  },
  {
    "id": 1,
    "slug": "boston-tea-party",
    "date": "1773-12-16",
    "year": 1773,
    "title": "Boston Tea Party",
    "wiki": "Boston_Tea_Party",
    "image": "/events/01-boston-tea-party.jpg",
    "location": "Boston Harbor, Massachusetts",
    "lat": 42.352,
    "lng": -71.048,
    "type": "political",
    "side": "american",
    "description": "Colonists, disguised as Mohawk Indians, boarded three British ships and dumped 342 chests of tea into Boston Harbor to protest the Tea Act. This act of defiance galvanized colonial resistance and led Britain to pass the punitive Intolerable Acts.",
    "significance": "Catalyst for revolution; demonstrated colonial willingness to take direct action against British policies.",
    "source": {
      "label": "National Park Service — Timeline of the Revolution",
      "url": "https://www.nps.gov/subjects/americanrevolution/timeline.htm"
    }
  },
  {
    "id": 103,
    "slug": "coercive-acts-target-massachusetts",
    "date": "1774-03-31",
    "endDate": "1774-06-22",
    "duration": "Spring 1774",
    "year": 1774,
    "title": "Coercive Acts Target Massachusetts",
    "location": "Boston, Massachusetts",
    "lat": 42.3601,
    "lng": -71.0589,
    "type": "political",
    "side": "british",
    "facts": [
      {
        "label": "Measures labeled “Intolerable”",
        "value": "5"
      },
      {
        "label": "Boston port closed",
        "value": "June 1"
      }
    ],
    "description": "Parliament answered the Tea Party with a series of punitive measures: closing Boston's port, reshaping Massachusetts government, expanding quartering rules, protecting royal officials from local trials, and passing the Quebec Act. Colonists grouped them together as the Intolerable Acts.",
    "significance": "Britain's attempt to isolate Massachusetts instead generated sympathy and collective action across the colonies.",
    "source": {
      "label": "National Park Service — Timeline of the Revolution",
      "url": "https://www.nps.gov/subjects/americanrevolution/timeline.htm"
    }
  },
  {
    "id": 2,
    "slug": "first-continental-congress",
    "date": "1774-09-05",
    "endDate": "1774-10-26",
    "duration": "52 days",
    "year": 1774,
    "title": "First Continental Congress",
    "wiki": "First_Continental_Congress",
    "image": "/events/02-first-continental-congress.jpg",
    "location": "Carpenters' Hall\nPhiladelphia, Pennsylvania",
    "lat": 39.9471,
    "lng": -75.1475,
    "type": "political",
    "side": "american",
    "description": "Delegates from 12 colonies (Georgia abstained) met at Carpenters' Hall to coordinate a response to the Intolerable Acts. They created the Continental Association to boycott British goods and drafted a Declaration of Rights outlining colonial grievances to King George III.",
    "significance": "First unified colonial action; established framework for intercolonial cooperation that would become the foundation of American government.",
    "source": {
      "label": "National Park Service — First Continental Congress",
      "url": "https://www.nps.gov/inde/learn/historyculture/places-carpentershall.htm"
    }
  },
  {
    "id": 3,
    "slug": "battles-of-lexington-and-concord",
    "date": "1775-04-19",
    "year": 1775,
    "title": "Battles of Lexington and Concord",
    "wiki": "Battles_of_Lexington_and_Concord",
    "image": "/events/03-lexington-concord.jpg",
    "location": "Lexington & Concord, Massachusetts",
    "lat": 42.4495,
    "lng": -71.231,
    "type": "battle",
    "turningPoint": "the dispute becomes a war",
    "side": "american",
    "casualties": {
      "american": 93,
      "british": 300
    },
    "forces": {
      "american": 3960,
      "british": 1500
    },
    "outcome": "american",
    "campaign": "New England",
    "description": "The 'shot heard round the world.' British troops marched to seize colonial weapons at Concord. Colonial militiamen confronted them at Lexington Green, and fighting erupted. By day's end, colonists had inflicted some 300 British casualties while suffering 93 of their own.",
    "significance": "First military engagements of the Revolutionary War; proved colonists would fight.",
    "source": {
      "label": "American Battlefield Trust — Lexington and Concord",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/lexington-and-concord"
    }
  },
  {
    "id": 4,
    "slug": "second-continental-congress-convenes",
    "date": "1775-05-10",
    "endDate": "1781-03-01",
    "duration": "~6 years (until Articles ratified)",
    "year": 1775,
    "title": "Second Continental Congress Convenes",
    "wiki": "Second_Continental_Congress",
    "image": "/events/04-second-continental-congress.jpg",
    "location": "Independence Hall\nPhiladelphia, Pennsylvania",
    "lat": 39.9489,
    "lng": -75.15,
    "type": "political",
    "side": "american",
    "description": "Delegates reconvened in Philadelphia just weeks after Lexington and Concord. On June 14, they voted to create the Continental Army, and on June 15, unanimously elected George Washington as Commander-in-Chief. John Hancock served as president of this Congress.",
    "significance": "Created the Continental Army and unified military command; established the governing body that would declare independence.",
    "source": {
      "label": "National Park Service — American Revolution Overview",
      "url": "https://www.nps.gov/inde/learn/historyculture/resources-americanrevolutionoverview.htm"
    }
  },
  {
    "id": 104,
    "slug": "capture-of-fort-ticonderoga",
    "date": "1775-05-10",
    "year": 1775,
    "title": "Capture of Fort Ticonderoga",
    "location": "Fort Ticonderoga, New York",
    "lat": 43.8414,
    "lng": -73.3871,
    "type": "battle",
    "side": "american",
    "casualties": {
      "american": 1,
      "british": 48
    },
    "forces": {
      "american": 83,
      "british": 48
    },
    "combatants": {
      "american": "Green Mountain Boys",
      "british": "British garrison"
    },
    "outcome": "american",
    "outcomeLabel": "Patriot capture",
    "campaign": "Canadian",
    "statNote": "No one was killed. The Crown casualty total consists almost entirely of the 48-man garrison captured with the fort.",
    "description": "Ethan Allen and Benedict Arnold, co-commanding 83 men — Green Mountain Boys alongside Massachusetts and Connecticut volunteers — surprised the small British garrison at dawn and took the fort without a firefight. Months later Henry Knox hauled its heavy cannon across winter roads to the army outside Boston.",
    "significance": "The war's first offensive American victory supplied the artillery that made the British evacuation of Boston possible.",
    "source": {
      "label": "American Battlefield Trust — Fort Ticonderoga (1775)",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/fort-ticonderoga-1775"
    }
  },
  {
    "id": 5,
    "slug": "battle-of-bunker-hill",
    "date": "1775-06-17",
    "year": 1775,
    "title": "Battle of Bunker Hill",
    "wiki": "Battle_of_Bunker_Hill",
    "image": "/events/05-bunker-hill.jpg",
    "location": "Charlestown, Massachusetts",
    "lat": 42.3763,
    "lng": -71.0608,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 450,
      "british": 1054
    },
    "forces": {
      "american": 2200,
      "british": 3000
    },
    "outcome": "british",
    "campaign": "New England",
    "description": "Colonial forces fortified Breed's Hill overlooking Boston. British regulars launched three frontal assaults, finally taking the position after the defenders' ammunition ran low. The victory cost Britain 1,054 casualties—more than a third of the attacking force—and shattered expectations of a short war.",
    "significance": "Though a British victory, it proved American forces could stand against professional soldiers.",
    "source": {
      "label": "American Battlefield Trust — Bunker Hill",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/bunker-hill"
    }
  },
  {
    "id": 126,
    "slug": "proclamation-of-rebellion",
    "date": "1775-08-23",
    "year": 1775,
    "title": "Proclamation of Rebellion",
    "location": "Court of St James's\nLondon, Great Britain",
    "lat": 51.5045,
    "lng": -0.1396,
    "type": "political",
    "side": "british",
    "facts": [
      {
        "label": "Issued by",
        "value": "George III"
      },
      {
        "label": "Olive Branch Petition",
        "value": "Refused a reading"
      }
    ],
    "description": "Congress had sent the Olive Branch Petition in July, professing loyalty and asking the King to intervene against Parliament. Richard Penn carried it to London, where George III declined to receive it. Instead the King proclaimed the colonies in open and avowed rebellion and directed his officers to suppress it and to report anyone in traitorous correspondence with the rebels.",
    "significance": "The last plausible route back to reconciliation closed here, in London, not in America. Paired with the Prohibitory Act that December, it placed the colonies outside the King's protection—an argument Congress would turn around and use to justify independence.",
    "source": {
      "label": "National Park Service — Timeline of the Revolution",
      "url": "https://www.nps.gov/subjects/americanrevolution/timeline.htm"
    }
  },
  {
    "id": 105,
    "slug": "dunmores-proclamation",
    "date": "1775-11-07",
    "year": 1775,
    "title": "Dunmore's Proclamation",
    "location": "Off Norfolk, Virginia",
    "lat": 36.8508,
    "lng": -76.2859,
    "type": "political",
    "side": "british",
    "facts": [
      {
        "label": "Black people serving Crown",
        "value": "≈20,000"
      },
      {
        "label": "Serving Patriot cause",
        "value": "5,000–6,000"
      }
    ],
    "description": "Virginia's royal governor, Lord Dunmore, offered freedom to enslaved people owned by rebels who escaped and could bear arms for the Crown. Later British policy broadened the offer. Tens of thousands sought freedom behind British lines, while thousands of Black soldiers also served the Patriot cause.",
    "significance": "The proclamation made slavery and self-emancipation central to the war, exposing the limits of revolutionary claims about liberty.",
    "source": {
      "label": "National Park Service — African Americans at Guilford Courthouse",
      "url": "https://www.nps.gov/guco/learn/historyculture/african-americans-guilford-courthouse.htm"
    }
  },
  {
    "id": 106,
    "slug": "battle-of-quebec",
    "date": "1775-12-31",
    "year": 1775,
    "title": "Battle of Quebec",
    "location": "Quebec City, Quebec",
    "lat": 46.8139,
    "lng": -71.208,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 515,
      "british": 18
    },
    "forces": {
      "american": 1200,
      "british": 1800
    },
    "combatants": {
      "american": "Continental forces",
      "british": "British & Canadian defenders"
    },
    "outcome": "british",
    "campaign": "Canadian",
    "statNote": "American casualties include hundreds captured after the failed assault.",
    "description": "In a blizzard, two exhausted American columns attacked the fortified city. Richard Montgomery was killed, Benedict Arnold was wounded, and Daniel Morgan's force was trapped and captured. The surviving army maintained a weak siege before retreating from Canada in 1776.",
    "significance": "The failed invasion ended the best American chance to bring Canada into the rebellion and secured Britain's northern base.",
    "source": {
      "label": "American Battlefield Trust — Quebec",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/quebec"
    }
  },
  {
    "id": 6,
    "slug": "publication-of-common-sense",
    "date": "1776-01-10",
    "year": 1776,
    "title": "Publication of Common Sense",
    "wiki": "Common_Sense",
    "image": "/events/06-common-sense.jpg",
    "location": "Philadelphia, Pennsylvania",
    "lat": 39.9526,
    "lng": -75.1652,
    "type": "political",
    "side": "american",
    "description": "Thomas Paine anonymously published his 47-page pamphlet arguing for complete independence from Britain. Written in plain language accessible to common colonists, it sold an estimated 100,000 copies within months and as many as 500,000 over the course of the war—the best-selling American title per capita of its era.",
    "significance": "Transformed the debate from colonial rights to full independence; galvanized public support for revolution.",
    "source": {
      "label": "National Park Service — Timeline of the Revolution",
      "url": "https://www.nps.gov/subjects/americanrevolution/timeline.htm"
    }
  },
  {
    "id": 7,
    "slug": "british-evacuation-of-boston",
    "date": "1776-03-17",
    "year": 1776,
    "title": "British Evacuation of Boston",
    "wiki": "Evacuation_Day_(Massachusetts)",
    "image": "/events/07-evacuation-boston.jpg",
    "location": "Dorchester Heights\nBoston, Massachusetts",
    "lat": 42.3314,
    "lng": -71.0535,
    "type": "military",
    "turningPoint": "the army's first strategic victory, and the British quit New England for good",
    "side": "american",
    "description": "After Washington's forces secretly fortified Dorchester Heights with cannons hauled from Fort Ticonderoga, the British position became untenable. General Howe evacuated some 8,900 troops and 1,100 Loyalists aboard a fleet of well over a hundred ships to Halifax, ending the 11-month Siege of Boston.",
    "significance": "First major American victory; liberated Boston and drove the British from New England.",
    "source": {
      "label": "National Park Service — The Evacuation of Boston, 1776",
      "url": "https://www.nps.gov/articles/000/evacuation-of-boston-1776.htm"
    }
  },
  {
    "id": 8,
    "slug": "declaration-of-independence",
    "date": "1776-07-04",
    "year": 1776,
    "title": "Declaration of Independence",
    "wiki": "United_States_Declaration_of_Independence",
    "image": "/events/08-declaration.jpg",
    "location": "Philadelphia, Pennsylvania",
    "lat": 39.9489,
    "lng": -75.15,
    "type": "political",
    "turningPoint": "the aim changes from redress to independence",
    "side": "american",
    "description": "The Continental Congress adopted Thomas Jefferson's Declaration of Independence, formally severing ties with Britain. The document articulated Enlightenment ideals of natural rights and consent of the governed, influencing democratic movements worldwide.",
    "significance": "Birth of the United States as an independent nation; defined American ideals of liberty and equality.",
    "source": {
      "label": "National Archives — Declaration of Independence",
      "url": "https://www.archives.gov/founding-docs/declaration"
    }
  },
  {
    "id": 9,
    "slug": "battle-of-long-island",
    "date": "1776-08-27",
    "endDate": "1776-08-30",
    "duration": "4 days (battle to evacuation)",
    "year": 1776,
    "title": "Battle of Long Island",
    "wiki": "Battle_of_Long_Island",
    "image": "/events/09-long-island.jpg",
    "location": "Brooklyn Heights\nNew York, New York",
    "lat": 40.6892,
    "lng": -73.9975,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 2000,
      "british": 388
    },
    "forces": {
      "american": 10000,
      "british": 20000
    },
    "outcome": "british",
    "campaign": "New York & New Jersey",
    "description": "The largest battle of the Revolutionary War, with over 30,000 troops engaged. British forces outflanked Washington's army, inflicting some 2,000 casualties, including over 1,000 captured. The Maryland 400 made a heroic stand at Gowanus Creek. Washington masterfully evacuated his entire army across the East River under cover of fog.",
    "significance": "Largest battle of the war; British captured New York City for seven years, but Washington's army survived to fight on.",
    "source": {
      "label": "American Battlefield Trust — Brooklyn",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/brooklyn"
    }
  },
  {
    "id": 107,
    "slug": "battle-of-fort-washington",
    "date": "1776-11-16",
    "year": 1776,
    "title": "Battle of Fort Washington",
    "location": "Manhattan\nNew York, New York",
    "lat": 40.8517,
    "lng": -73.9383,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 155,
      "british": 458
    },
    "forces": {
      "american": 3000,
      "british": 8000
    },
    "outcome": "british",
    "campaign": "New York & New Jersey",
    "statNote": "The battlefield estimate lists killed and wounded; roughly 2,800 additional American defenders surrendered with the fort.",
    "facts": [
      {
        "label": "American prisoners",
        "value": "≈2,800"
      }
    ],
    "description": "British and Hessian columns overwhelmed Fort Washington, the last American stronghold on Manhattan. Colonel Robert Magaw surrendered about 2,800 surviving defenders, many of whom later died aboard prison ships or in crowded jails.",
    "significance": "The loss completed Washington's disastrous New York campaign and pushed the shrinking Continental Army across New Jersey.",
    "source": {
      "label": "American Battlefield Trust — Fort Washington",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/fort-washington"
    }
  },
  {
    "id": 127,
    "slug": "franklin-arrives-in-france",
    "date": "1776-12-21",
    "year": 1776,
    "title": "Franklin Arrives in France",
    "location": "Passy, near Paris, France",
    "lat": 48.857,
    "lng": 2.279,
    "type": "diplomatic",
    "side": "american",
    "facts": [
      {
        "label": "Age on arrival",
        "value": "70"
      },
      {
        "label": "Commissioners",
        "value": "Franklin, Deane, Lee"
      }
    ],
    "description": "Benjamin Franklin sailed from Philadelphia in October aboard the Reprisal, landed at Auray in Brittany in early December, and reached Paris on December 21 to join Silas Deane and Arthur Lee. France was already funnelling covert money and munitions through a front company; the commissioners' task was to convert that quiet help into an open alliance. Franklin settled at Passy and made himself the most recognisable American in Europe.",
    "significance": "The war's other front was diplomatic, and it ran through Paris for seven years. Nothing France later did—the fleet at the Chesapeake, the siege guns at Yorktown, the money that kept Congress solvent—was available until someone won the argument here.",
    "source": {
      "label": "Office of the Historian — Benjamin Franklin",
      "url": "https://history.state.gov/departmenthistory/people/franklin-benjamin"
    }
  },
  {
    "id": 10,
    "slug": "battle-of-trenton",
    "date": "1776-12-26",
    "year": 1776,
    "title": "Battle of Trenton",
    "wiki": "Battle_of_Trenton",
    "image": "/events/10-trenton.jpg",
    "location": "Trenton, New Jersey",
    "lat": 40.2206,
    "lng": -74.7597,
    "type": "battle",
    "turningPoint": "stops the rout after New York and keeps the army in being",
    "side": "american",
    "casualties": {
      "american": 5,
      "british": 905
    },
    "forces": {
      "american": 2400,
      "british": 1500
    },
    "outcome": "american",
    "campaign": "New York & New Jersey",
    "description": "After crossing the ice-choked Delaware River on Christmas night, Washington launched a surprise attack on Hessian mercenaries. The Americans captured some 800 prisoners with minimal casualties, reviving a cause that had seemed lost after months of defeat.",
    "significance": "Restored American morale after devastating losses; proved Washington's tactical genius.",
    "combatants": {
      "american": "Continental Army",
      "british": "Hessian garrison"
    },
    "source": {
      "label": "American Battlefield Trust — Trenton",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/trenton"
    }
  },
  {
    "id": 108,
    "slug": "battle-of-princeton",
    "date": "1777-01-03",
    "year": 1777,
    "title": "Battle of Princeton",
    "location": "Princeton, New Jersey",
    "lat": 40.3317,
    "lng": -74.675,
    "type": "battle",
    "side": "american",
    "casualties": {
      "american": 75,
      "british": 270
    },
    "forces": {
      "american": 4500,
      "british": 1200
    },
    "outcome": "american",
    "campaign": "New York & New Jersey",
    "description": "After slipping away from Cornwallis at Trenton, Washington struck the British detachment at Princeton. He personally rallied wavering troops, broke the British line, and then moved into winter quarters in northern New Jersey.",
    "significance": "Together with Trenton, Princeton reversed the collapse of late 1776, encouraged enlistment, and forced Britain to abandon most New Jersey outposts.",
    "source": {
      "label": "American Battlefield Trust — Princeton",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/princeton"
    }
  },
  {
    "id": 109,
    "slug": "fall-of-fort-ticonderoga",
    "date": "1777-07-02",
    "endDate": "1777-07-06",
    "duration": "5 days",
    "year": 1777,
    "title": "Fall of Fort Ticonderoga",
    "location": "Fort Ticonderoga, New York",
    "lat": 43.8414,
    "lng": -73.3871,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 18,
      "british": 5
    },
    "forces": {
      "american": 3000,
      "british": 7800
    },
    "outcome": "british",
    "campaign": "Saratoga",
    "statNote": "Most of the garrison escaped before a general assault; the low totals reflect the siege itself, not the fighting during the retreat.",
    "description": "Burgoyne's engineers hauled cannon onto Mount Defiance, high ground that dominated the American fortifications. Facing encirclement, Arthur St. Clair evacuated the garrison before dawn on July 6; British troops occupied the post without the expected siege.",
    "significance": "The 1777 loss—not the separate Patriot capture in 1775—opened Burgoyne's route south and caused a political uproar before the campaign turned against him.",
    "source": {
      "label": "American Battlefield Trust — Fort Ticonderoga (1777)",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/fort-ticonderoga-1777"
    }
  },
  {
    "id": 110,
    "slug": "battle-of-oriskany",
    "date": "1777-08-06",
    "year": 1777,
    "title": "Battle of Oriskany",
    "location": "Oriskany, New York",
    "lat": 43.1776,
    "lng": -75.3677,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 465,
      "british": 28
    },
    "forces": {
      "american": 800,
      "british": 500
    },
    "combatants": {
      "american": "Patriot militia & Oneida allies",
      "british": "Loyalists & Haudenosaunee allies"
    },
    "outcome": "british",
    "campaign": "Saratoga",
    "statNote": "Known Crown casualties omit many Indigenous losses. The battle split Haudenosaunee communities and placed relatives on opposing sides.",
    "description": "A Loyalist and Haudenosaunee force ambushed militia marching to relieve Fort Stanwix. The close-range struggle devastated both columns and divided the Six Nations: Oneida warriors fought beside Patriots while Mohawk and Seneca warriors largely supported the Crown.",
    "significance": "One of the war's bloodiest small battles blunted the western arm of Burgoyne's plan and turned an imperial war into a Haudenosaunee civil war.",
    "source": {
      "label": "American Battlefield Trust — Oriskany",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/oriskany"
    }
  },
  {
    "id": 111,
    "slug": "battle-of-brandywine",
    "date": "1777-09-11",
    "year": 1777,
    "title": "Battle of Brandywine",
    "location": "Chadds Ford, Pennsylvania",
    "lat": 39.8744,
    "lng": -75.5944,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 1300,
      "british": 587
    },
    "forces": {
      "american": 14600,
      "british": 15500
    },
    "outcome": "british",
    "campaign": "Philadelphia",
    "description": "Howe pinned Washington at Chadds Ford while Cornwallis made a long flanking march across the Brandywine. The Americans escaped in good order but could not prevent the British from occupying Philadelphia two weeks later.",
    "significance": "The largest battle of the Philadelphia campaign cost the revolutionary government its capital, though Congress and the army survived.",
    "source": {
      "label": "American Battlefield Trust — Brandywine",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/brandywine"
    }
  },
  {
    "id": 112,
    "slug": "battle-of-germantown",
    "date": "1777-10-04",
    "year": 1777,
    "title": "Battle of Germantown",
    "location": "Germantown\nPhiladelphia, Pennsylvania",
    "lat": 40.0406,
    "lng": -75.173,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 1111,
      "british": 533
    },
    "forces": {
      "american": 11000,
      "british": 9000
    },
    "outcome": "british",
    "campaign": "Philadelphia",
    "description": "Washington attempted a complex four-column dawn attack on the British camp outside occupied Philadelphia. Thick fog, confused roads, friendly fire, and resistance at the stone Chew House broke the assault after promising early gains.",
    "significance": "The defeat still impressed European observers: the Continental Army had attacked a major British force only weeks after Brandywine.",
    "source": {
      "label": "American Battlefield Trust — Germantown",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/germantown"
    }
  },
  {
    "id": 11,
    "slug": "british-surrender-at-saratoga",
    "date": "1777-10-17",
    "endDate": null,
    "duration": "Campaign: Sept 19 - Oct 17 (battles Sept 19 & Oct 7)",
    "year": 1777,
    "title": "British Surrender at Saratoga",
    "wiki": "Battles_of_Saratoga",
    "image": "/events/11-saratoga.jpg",
    "location": "Saratoga, New York",
    "lat": 43.0025,
    "lng": -73.626,
    "type": "battle",
    "turningPoint": "a whole British army surrendered; it brought France in",
    "side": "american",
    "casualties": {
      "american": 330,
      "british": 1135
    },
    "forces": {
      "american": 15000,
      "british": 6000
    },
    "outcome": "american",
    "campaign": "Saratoga",
    "description": "British General John Burgoyne surrendered his entire army of 6,000 men after being surrounded by American forces. This was the first surrender of an entire British army and the war's turning point, as it convinced France to formally ally with the United States.",
    "significance": "Turning point of the war; secured crucial French alliance with military and financial support.",
    "source": {
      "label": "American Battlefield Trust — Saratoga",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/saratoga"
    }
  },
  {
    "id": 12,
    "slug": "articles-of-confederation-adopted",
    "date": "1777-11-15",
    "year": 1777,
    "title": "Articles of Confederation Adopted",
    "wiki": "Articles_of_Confederation",
    "image": "/events/12-articles-confederation.jpg",
    "location": "York, Pennsylvania",
    "lat": 39.9626,
    "lng": -76.7277,
    "type": "political",
    "side": "american",
    "description": "Congress adopted America's first constitution after 16 months of debate while meeting in York. The Articles created a loose confederation in which each state retained sovereignty and each cast one vote. Maryland's approval completed unanimous ratification on March 1, 1781.",
    "significance": "First framework for American national government; held the states together until replaced by the Constitution in 1789.",
    "endDate": "1781-03-01",
    "duration": "Adopted 1777; fully ratified 1781",
    "facts": [
      {
        "label": "States required",
        "value": "13"
      },
      {
        "label": "Ratified",
        "value": "March 1, 1781"
      }
    ],
    "source": {
      "label": "National Archives — Articles of Confederation",
      "url": "https://www.archives.gov/milestone-documents/articles-of-confederation"
    }
  },
  {
    "id": 13,
    "slug": "valley-forge-winter-encampment",
    "date": "1777-12-19",
    "endDate": "1778-06-19",
    "duration": "6 months",
    "year": 1777,
    "title": "Valley Forge Winter Encampment",
    "wiki": "Valley_Forge",
    "image": "/events/13-valley-forge.jpg",
    "location": "Valley Forge, Pennsylvania",
    "lat": 40.1033,
    "lng": -75.4444,
    "type": "military",
    "turningPoint": "the army that marched out was retrained, and held the line at Monmouth nine days later",
    "side": "american",
    "description": "The Continental Army endured a brutal winter at Valley Forge. Nearly 2,000 men died — most of disease rather than cold or hunger, and two-thirds of them during the warmer months of spring — yet the army emerged stronger. Baron von Steuben drilled the troops into a professional fighting force, transforming them from militia to soldiers.",
    "significance": "Crucible that forged the Continental Army into an effective fighting force; symbol of American perseverance.",
    "source": {
      "label": "National Park Service — Valley Forge History",
      "url": "https://www.nps.gov/vafo/learn/historyculture/valley-forge-history-and-significance.htm"
    }
  },
  {
    "id": 128,
    "slug": "treaty-of-alliance-signed-with-france",
    "date": "1778-02-06",
    "year": 1778,
    "title": "Treaty of Alliance Signed with France",
    "location": "Paris, France",
    "lat": 48.8676,
    "lng": 2.3212,
    "type": "diplomatic",
    "turningPoint": "a colonial rebellion becomes a European war",
    "side": "american",
    "facts": [
      {
        "label": "Treaties signed",
        "value": "2"
      },
      {
        "label": "Separate peace",
        "value": "Forbidden to both"
      }
    ],
    "description": "Saratoga did what fourteen months of persuasion could not: it convinced Vergennes the Americans could win. Franklin, Deane, and Lee signed two treaties with Conrad Alexandre Gérard—one of amity and commerce, one of alliance. France recognised the United States, renounced any claim to territory east of the Mississippi, and both parties bound themselves not to make a separate peace.",
    "significance": "A colonial rebellion became a European war. Britain now had to defend the Caribbean, Gibraltar, and the Channel, and could no longer concentrate against the Continental Army.",
    "source": {
      "label": "National Archives — Treaty of Alliance with France (1778)",
      "url": "https://www.archives.gov/milestone-documents/treaty-of-alliance-with-france"
    }
  },
  {
    "id": 113,
    "slug": "congress-ratifies-the-french-alliance",
    "date": "1778-05-04",
    "year": 1778,
    "title": "Congress Ratifies the French Alliance",
    "location": "York, Pennsylvania",
    "lat": 39.9626,
    "lng": -76.7277,
    "type": "diplomatic",
    "side": "american",
    "facts": [
      {
        "label": "Treaties signed in Paris",
        "value": "2"
      },
      {
        "label": "Congressional vote",
        "value": "Unanimous"
      }
    ],
    "description": "France and the United States signed treaties of amity, commerce, and military alliance in Paris on February 6. Congress unanimously ratified them at York on May 4, converting secret aid into an open alliance and widening the rebellion into a global war.",
    "significance": "French money, troops, weapons, and naval power changed the strategic balance and ultimately made Yorktown possible.",
    "source": {
      "label": "National Archives — Our Nation's First Ally",
      "url": "https://visit.archives.gov/whats-on/explore-exhibits/opening-vault-our-nations-first-ally"
    }
  },
  {
    "id": 14,
    "slug": "battle-of-monmouth",
    "date": "1778-06-28",
    "year": 1778,
    "title": "Battle of Monmouth",
    "wiki": "Battle_of_Monmouth",
    "image": "/events/14-monmouth.jpg",
    "location": "Monmouth Court House\nFreehold, New Jersey",
    "lat": 40.2593,
    "lng": -74.2765,
    "type": "battle",
    "side": "american",
    "casualties": {
      "american": 325,
      "british": 381
    },
    "forces": {
      "american": 5400,
      "british": 10000
    },
    "outcome": "indecisive",
    "campaign": "Philadelphia",
    "description": "In extreme heat, the Continental Army engaged retreating British forces in the longest single-day battle of the war. Washington rallied his troops after General Charles Lee ordered a retreat. Legend holds that 'Molly Pitcher' manned a cannon after her husband fell.",
    "significance": "Proved Valley Forge training had transformed the Continental Army; last major battle in the North.",
    "outcomeLabel": "Inconclusive",
    "source": {
      "label": "American Battlefield Trust — Monmouth",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/monmouth"
    }
  },
  {
    "id": 114,
    "slug": "battle-of-rhode-island",
    "date": "1778-08-29",
    "year": 1778,
    "title": "Battle of Rhode Island",
    "location": "Aquidneck Island, Rhode Island",
    "lat": 41.6023,
    "lng": -71.2503,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 181,
      "british": 260
    },
    "forces": {
      "american": 10100,
      "british": 6700
    },
    "combatants": {
      "american": "American forces",
      "british": "British & Hessian forces"
    },
    "outcome": "indecisive",
    "outcomeLabel": "Inconclusive",
    "campaign": "Northern",
    "description": "America's first planned joint operation with France unraveled when the French fleet left to face the Royal Navy and then repair storm damage. John Sullivan's army withdrew from Newport but held off British and Hessian attacks; the integrated 1st Rhode Island Regiment fought prominently.",
    "significance": "The inconclusive battle exposed the difficulty of coalition warfare and highlighted the service of Black and Native soldiers in the Continental ranks.",
    "source": {
      "label": "American Battlefield Trust — Rhode Island",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/rhode-island"
    }
  },
  {
    "id": 115,
    "slug": "sullivan-clinton-campaign",
    "date": "1779-08-26",
    "endDate": "1779-09-30",
    "duration": "Main invasion: Aug 26–Sept 1779",
    "year": 1779,
    "title": "Sullivan–Clinton Campaign",
    "location": "Haudenosaunee homelands\nWestern New York",
    "lat": 42.0898,
    "lng": -76.8077,
    "type": "military",
    "side": "american",
    "facts": [
      {
        "label": "Continental troops",
        "value": "≈4,469"
      },
      {
        "label": "Towns destroyed",
        "value": "40+"
      }
    ],
    "description": "After destructive Loyalist and Indigenous raids on frontier settlements, Washington ordered John Sullivan and James Clinton to break the military power of the Six Nations. Following victory at Newtown, Continental troops burned more than forty Haudenosaunee towns and destroyed crops and orchards.",
    "significance": "The campaign reduced raids but created thousands of refugees and dealt a devastating, long-lasting blow to Haudenosaunee communities.",
    "source": {
      "label": "National Park Service — Clinton–Sullivan Campaign",
      "url": "https://www.nps.gov/articles/000/the-clinton-sullivan-campaign-of-1779.htm"
    }
  },
  {
    "id": 116,
    "slug": "siege-of-savannah",
    "date": "1779-09-16",
    "endDate": "1779-10-20",
    "duration": "35 days",
    "year": 1779,
    "title": "Siege of Savannah",
    "location": "Savannah, Georgia",
    "lat": 32.0762,
    "lng": -81.0998,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 948,
      "british": 155
    },
    "forces": {
      "american": 5050,
      "british": 3200
    },
    "combatants": {
      "american": "American & French allies",
      "british": "British & Loyalist defenders"
    },
    "outcome": "british",
    "campaign": "Southern",
    "description": "A combined French-American army besieged the British garrison, then launched a rushed frontal assault on October 9. The attackers suffered devastating losses, including Polish cavalry commander Casimir Pulaski; free Black troops from Saint-Domingue served in the allied force.",
    "significance": "The failed siege kept Georgia under British control and showed that French participation did not guarantee easy coalition victories.",
    "source": {
      "label": "American Battlefield Trust — Savannah",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/savannah"
    }
  },
  {
    "id": 117,
    "slug": "siege-of-charleston",
    "date": "1780-02-11",
    "endDate": "1780-05-12",
    "duration": "92 days",
    "year": 1780,
    "title": "Siege of Charleston",
    "location": "Charleston, South Carolina",
    "lat": 32.7765,
    "lng": -79.9311,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 5506,
      "british": 258
    },
    "forces": {
      "american": 6577,
      "british": 12847
    },
    "combatants": {
      "american": "American defenders",
      "british": "British, Hessian & Loyalist forces"
    },
    "outcome": "british",
    "campaign": "Southern",
    "statNote": "The American total is dominated by more than 5,000 troops captured at surrender.",
    "description": "Henry Clinton approached by land while the Royal Navy entered the harbor, trapping Benjamin Lincoln's army and Charleston's civilians. After weeks of bombardment and tightening siege lines, Lincoln surrendered the city and more than 5,000 troops.",
    "significance": "The largest American surrender of the war shattered organized resistance in the Deep South and opened Britain's most ambitious Southern offensive.",
    "source": {
      "label": "American Battlefield Trust — Charleston",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/charleston"
    }
  },
  {
    "id": 118,
    "slug": "battle-of-camden",
    "date": "1780-08-16",
    "year": 1780,
    "title": "Battle of Camden",
    "location": "Camden, South Carolina",
    "lat": 34.2465,
    "lng": -80.607,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 1050,
      "british": 324
    },
    "forces": {
      "american": 3690,
      "british": 2239
    },
    "combatants": {
      "american": "Continentals & Patriot militia",
      "british": "British & Loyalist forces"
    },
    "outcome": "british",
    "campaign": "Southern",
    "description": "Horatio Gates placed inexperienced militia opposite Cornwallis's veteran regulars. A British bayonet advance sent the militia fleeing, leaving Maryland and Delaware Continentals to be overwhelmed; Baron de Kalb was mortally wounded.",
    "significance": "A catastrophic American defeat cleared organized resistance from South Carolina and led Congress to give the Southern command to Nathanael Greene.",
    "source": {
      "label": "American Battlefield Trust — Camden",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/camden"
    }
  },
  {
    "id": 15,
    "slug": "arnolds-treason-discovered",
    "date": "1780-09-21",
    "endDate": "1780-09-25",
    "duration": "5 days (meeting to Arnold's escape)",
    "year": 1780,
    "title": "Arnold's Treason Discovered",
    "wiki": "Benedict_Arnold",
    "image": "/events/15-arnold-treason.jpg",
    "location": "West Point, New York",
    "lat": 41.3915,
    "lng": -73.9565,
    "type": "political",
    "side": "british",
    "description": "American General Benedict Arnold's plot to surrender West Point to the British was exposed when Major John André was captured with incriminating papers. Arnold fled to the British ship HMS Vulture just hours before Washington arrived. André was hanged as a spy.",
    "significance": "Most infamous betrayal in American history; 'Benedict Arnold' became synonymous with traitor.",
    "source": {
      "label": "National Park Service — Timeline of the Revolution",
      "url": "https://www.nps.gov/subjects/americanrevolution/timeline.htm"
    }
  },
  {
    "id": 119,
    "slug": "battle-of-kings-mountain",
    "date": "1780-10-07",
    "year": 1780,
    "title": "Battle of Kings Mountain",
    "location": "Kings Mountain, South Carolina",
    "lat": 35.1428,
    "lng": -81.3824,
    "type": "battle",
    "turningPoint": "breaks Loyalist recruiting and stalls the southern strategy",
    "side": "american",
    "casualties": {
      "american": 90,
      "british": 1018
    },
    "forces": {
      "american": 910,
      "british": 1125
    },
    "combatants": {
      "american": "Patriot militia",
      "british": "Loyalist militia"
    },
    "outcome": "american",
    "outcomeLabel": "Patriot victory",
    "campaign": "Southern",
    "statNote": "Except for British commander Patrick Ferguson, Americans fought Americans; the Crown column includes Loyalists killed, wounded, or captured.",
    "description": "Overmountain Patriot militia surrounded Patrick Ferguson's Loyalist force on a wooded ridge. Repeated Loyalist bayonet charges could not break the encircling riflemen; Ferguson was killed and most of his command was captured.",
    "significance": "The victory destroyed the western wing of Cornwallis's army and forced him to postpone his invasion of North Carolina.",
    "source": {
      "label": "American Battlefield Trust — Kings Mountain",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/kings-mountain"
    }
  },
  {
    "id": 120,
    "slug": "battle-of-cowpens",
    "date": "1781-01-17",
    "year": 1781,
    "title": "Battle of Cowpens",
    "location": "Cowpens, South Carolina",
    "lat": 35.1316,
    "lng": -81.8094,
    "type": "battle",
    "turningPoint": "costs Cornwallis his light troops and starts the march to Yorktown",
    "side": "american",
    "casualties": {
      "american": 149,
      "british": 868
    },
    "forces": {
      "american": 1065,
      "british": 1150
    },
    "combatants": {
      "american": "Continentals & Patriot militia",
      "british": "British & Loyalist forces"
    },
    "outcome": "american",
    "campaign": "Southern",
    "description": "Daniel Morgan arranged militia and Continentals in successive lines, asking the front ranks for only a few volleys before withdrawing. Banastre Tarleton mistook the controlled movement for a rout and drove his exhausted force into a double envelopment.",
    "significance": "A tactical masterpiece that destroyed much of Tarleton's command and drew Cornwallis into an exhausting pursuit across the Carolinas.",
    "source": {
      "label": "American Battlefield Trust — Cowpens",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/cowpens"
    }
  },
  {
    "id": 121,
    "slug": "spanish-gulf-campaign-culminates-at-pensacola",
    "date": "1781-03-09",
    "endDate": "1781-05-10",
    "duration": "Two-month siege",
    "year": 1781,
    "title": "Spanish Gulf Campaign Culminates at Pensacola",
    "location": "Pensacola, British West Florida",
    "lat": 30.4213,
    "lng": -87.2169,
    "type": "military",
    "side": "american",
    "facts": [
      {
        "label": "Siege length",
        "value": "≈2 months"
      },
      {
        "label": "Coalition",
        "value": "Spanish-led"
      }
    ],
    "description": "Spain entered the war as France's ally, not as a formal ally of the United States. From Louisiana, Bernardo de Gálvez captured British posts along the lower Mississippi and Gulf Coast, culminating at Pensacola: a Spanish shell blew up the Queen's Redoubt magazine on May 8, 1781, and General John Campbell surrendered West Florida two days later.",
    "significance": "The diverse Spanish-led coalition opened a second front, denied Britain its West Florida base, and tied down troops and ships before Yorktown.",
    "source": {
      "label": "National Park Service — Bernardo de Gálvez",
      "url": "https://www.nps.gov/foma/learn/historyculture/galvez.htm"
    }
  },
  {
    "id": 122,
    "slug": "battle-of-guilford-courthouse",
    "date": "1781-03-15",
    "year": 1781,
    "title": "Battle of Guilford Courthouse",
    "location": "Guilford Courthouse\nGreensboro, North Carolina",
    "lat": 36.1324,
    "lng": -79.8425,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 1310,
      "british": 532
    },
    "forces": {
      "american": 4400,
      "british": 2385
    },
    "combatants": {
      "american": "Continentals & Patriot militia",
      "british": "British & Hessian forces"
    },
    "outcome": "british",
    "campaign": "Southern",
    "statNote": "Many American casualties were militia listed as missing after Greene's orderly withdrawal.",
    "description": "Nathanael Greene deployed three defensive lines to wear down Cornwallis's smaller army. The British took the field after savage fighting, but lost more than a fifth of their force and lacked the supplies to pursue the retreating Americans.",
    "significance": "A costly British victory that drove Cornwallis toward the coast while Greene returned south to dismantle British control of the interior.",
    "source": {
      "label": "American Battlefield Trust — Guilford Courthouse",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/guilford-court-house"
    }
  },
  {
    "id": 123,
    "slug": "battle-of-the-chesapeake",
    "date": "1781-09-05",
    "year": 1781,
    "title": "Battle of the Chesapeake",
    "location": "Virginia Capes\nAtlantic Ocean",
    "lat": 36.9,
    "lng": -75.7,
    "type": "battle",
    "turningPoint": "the French fleet seals the bay; without it there is no siege",
    "side": "american",
    "combatants": {
      "american": "French Navy",
      "british": "Royal Navy"
    },
    "outcome": "allied",
    "outcomeLabel": "French strategic victory",
    "campaign": "Yorktown",
    "facts": [
      {
        "label": "Ships of the line engaged",
        "value": "24 French / 19 British"
      },
      {
        "label": "Sailor casualties",
        "value": "209 French / 336 British"
      }
    ],
    "statNote": "De Grasse had 28 ships of the line in the bay but got only 24 out to fight, many of his officers being ashore. De Barras added eight more after the battle, giving the French 36 by the time Graves returned.",
    "description": "Admiral de Grasse's fleet fought the Royal Navy off the Virginia Capes and retained control of Chesapeake Bay. The British withdrew to New York for repairs while French ships sealed Cornwallis inside Yorktown and delivered troops, money, artillery, and supplies.",
    "significance": "This naval action made the Yorktown siege possible by preventing British reinforcement or evacuation.",
    "source": {
      "label": "National Park Service — Battle of the Capes",
      "url": "https://www.nps.gov/york/learn/historyculture/battle-of-the-capes.htm"
    }
  },
  {
    "id": 124,
    "slug": "battle-of-eutaw-springs",
    "date": "1781-09-08",
    "year": 1781,
    "title": "Battle of Eutaw Springs",
    "location": "Eutaw Springs, South Carolina",
    "lat": 33.4071,
    "lng": -80.3023,
    "type": "battle",
    "side": "british",
    "casualties": {
      "american": 579,
      "british": 882
    },
    "forces": {
      "american": 2200,
      "british": 2000
    },
    "combatants": {
      "american": "Continentals & Patriot militia",
      "british": "British & Loyalist forces"
    },
    "outcome": "british",
    "outcomeLabel": "British tactical victory",
    "campaign": "Southern",
    "description": "Greene's army drove British troops through their camp before discipline broke amid abandoned supplies. The British rallied in a brick house and held the field, but their losses were so severe that they soon withdrew toward Charleston.",
    "significance": "The last major battle in the Carolinas left Britain confined to coastal enclaves even though Greene had not won a clear battlefield victory.",
    "source": {
      "label": "American Battlefield Trust — Eutaw Springs",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/eutaw-springs"
    }
  },
  {
    "id": 16,
    "slug": "siege-of-yorktown",
    "date": "1781-09-28",
    "endDate": "1781-10-19",
    "duration": "22 days",
    "year": 1781,
    "title": "Siege of Yorktown",
    "wiki": "Siege_of_Yorktown",
    "image": "/events/16-yorktown.jpg",
    "location": "Yorktown, Virginia",
    "lat": 37.2388,
    "lng": -76.5097,
    "type": "battle",
    "turningPoint": "ends major operations in North America",
    "side": "american",
    "casualties": {
      "american": 389,
      "british": 8589
    },
    "forces": {
      "american": 19900,
      "british": 9000
    },
    "outcome": "american",
    "campaign": "Yorktown",
    "description": "Washington and Rochambeau brought a combined American-French army to Yorktown while Admiral de Grasse's fleet blocked escape by sea. After a three-week siege, Cornwallis's army surrendered on October 19. The victory depended on French soldiers, engineers, artillery, money, and naval control.",
    "significance": "Last major battle; effectively ended the war and British hopes of retaining the colonies.",
    "combatants": {
      "american": "American & French allies",
      "british": "British & Hessian forces"
    },
    "statNote": "The Crown casualty total includes the army surrendered on October 19; Allied casualties combine American and French losses.",
    "source": {
      "label": "American Battlefield Trust — Yorktown",
      "url": "https://www.battlefields.org/learn/revolutionary-war/battles/yorktown"
    }
  },
  {
    "id": 129,
    "slug": "the-commons-votes-against-the-war",
    "date": "1782-02-27",
    "year": 1782,
    "title": "The Commons Votes Against the War",
    "location": "Palace of Westminster\nLondon, Great Britain",
    "lat": 51.4995,
    "lng": -0.1248,
    "type": "political",
    "turningPoint": "Britain gives up the war and opens negotiations",
    "side": "british",
    "facts": [
      {
        "label": "Division",
        "value": "234 to 215"
      },
      {
        "label": "North's ministry",
        "value": "Fell within a month"
      }
    ],
    "description": "Four months after Yorktown, Britain still held New York, Charleston, and Savannah and still had the larger fleet. What it no longer had was a majority. General Henry Conway's motion against further prosecution of the American war carried by nineteen votes, and Lord North resigned on March 20 after twelve years in office. The Rockingham ministry that replaced him opened peace talks in Paris that spring.",
    "significance": "The war did not end on a battlefield. It ended when the House of Commons withdrew its consent to pay for it, which is why the story crosses back to London before it reaches the treaty table.",
    "source": {
      "label": "Office of the Historian — Treaty of Paris, 1783",
      "url": "https://history.state.gov/milestones/1776-1783/treaty"
    }
  },
  {
    "id": 125,
    "slug": "treaty-of-paris-signed",
    "date": "1783-09-03",
    "year": 1783,
    "title": "Treaty of Paris Signed",
    "location": "Paris, France",
    "lat": 48.8566,
    "lng": 2.3522,
    "type": "diplomatic",
    "turningPoint": "independence recognised, and the war formally over",
    "side": "american",
    "facts": [
      {
        "label": "States recognized",
        "value": "13"
      },
      {
        "label": "Western boundary",
        "value": "Mississippi River"
      }
    ],
    "description": "John Adams, Benjamin Franklin, and John Jay signed the definitive peace with British representative David Hartley. Britain recognized the United States as free and independent, and the treaty set expansive boundaries reaching west to the Mississippi River.",
    "significance": "The treaty—not Yorktown—legally ended the war, secured international recognition, and created a vast new republic whose expansion threatened Native homelands.",
    "source": {
      "label": "National Archives — Treaty of Paris (1783)",
      "url": "https://www.archives.gov/milestone-documents/treaty-of-paris"
    }
  },
  {
    "id": 17,
    "slug": "british-evacuation-of-new-york",
    "date": "1783-11-25",
    "year": 1783,
    "title": "British Evacuation of New York",
    "wiki": "Evacuation_Day_(New_York)",
    "image": "/events/17-evacuation-new-york.jpg",
    "location": "Manhattan\nNew York, New York",
    "lat": 40.7033,
    "lng": -74.017,
    "type": "military",
    "side": "american",
    "description": "After seven years of occupation, the last British troops departed Manhattan as Washington and the Continental Army marched in from the north. This final sailing closed an evacuation that had run since spring: over 29,000 Loyalists left New York across 1783, and British inspectors recorded some 3,000 formerly enslaved people departing in freedom. Celebrated as 'Evacuation Day' for over a century.",
    "significance": "Final British departure from American soil; marked the true end of the Revolutionary War.",
    "source": {
      "label": "National Park Service — Timeline of the Revolution",
      "url": "https://www.nps.gov/subjects/americanrevolution/timeline.htm"
    }
  },
  {
    "id": 18,
    "slug": "washington-resigns-commission",
    "date": "1783-12-23",
    "year": 1783,
    "title": "Washington Resigns Commission",
    "wiki": "George_Washington's_resignation_as_commander-in-chief",
    "image": "/events/18-washington-resigns.jpg",
    "location": "Annapolis, Maryland",
    "lat": 38.9784,
    "lng": -76.4922,
    "type": "political",
    "side": "american",
    "description": "In a remarkable act of republican virtue, George Washington voluntarily surrendered his military commission to Congress. King George III reportedly said that if Washington did this, he would be 'the greatest man in the world.' Washington's act set the precedent of civilian control over the military.",
    "significance": "Established crucial precedent of civilian authority over the military; Washington became a symbol of republican ideals.",
    "source": {
      "label": "U.S. Senate — Washington Resigns His Commission",
      "url": "https://www.senate.gov/artandhistory/history/minute/Washington_Resigns_His_Commission.htm"
    }
  }
];

export const eventRange = {
  start: events[0].year,
  end: events[events.length - 1].year
};

// The address bar names an event by slug: #/explore/battle-of-bunker-hill.
//
// `id` is an internal key that only looks like a sequence number. The first
// 18 events were numbered 1-18 and the 29 added later took 101-129, so that
// nothing already linking to the first block had to move — which is exactly
// why it cannot be shown to a reader: 105 is not the 105th of 47 events, and
// the story runs 1, 103, 2, 3 when read off the URL. The slug is stored
// rather than derived so that rewording a title later does not break every
// link to it. Numeric links from before the change still resolve here and are
// rewritten to the slug by the story's own URL sync.
const eventsBySlug = new Map(events.map((event) => [event.slug, event]));
const eventsById = new Map(events.map((event) => [event.id, event]));

export const eventSlug = (id) => eventsById.get(id)?.slug ?? null;

// Resolve whatever followed `#/explore/` to an event id, or null when it
// names nothing: an unknown slug, a retired number, or `0`.
export function resolveEventKey(key) {
  if (key == null) return null;
  if (/^\d+$/.test(key)) return eventsById.has(Number(key)) ? Number(key) : null;
  return eventsBySlug.get(key)?.id ?? null;
}
