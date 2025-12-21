"""
解析 ICBC PDF 目录，提取所有章节和小节

使用方法:
    cd admin/backend
    uv run python -m app.scripts.parse_toc
"""
import json
import re
from pathlib import Path

# 基于目录页面内容手动整理的章节和小节数据
# 页码是 PDF 显示的逻辑页码，实际页码 = 逻辑页码 + 17（偏移量）
PAGE_OFFSET = 17

SECTIONS_DATA = [
    # Chapter 1: Getting your driver's licence
    {"chapter": "Chapter 1", "section": "Getting your driver's licence", "page": 3, "level": 1},
    {"chapter": "Chapter 1", "section": "What you'll learn", "page": 3, "level": 2},
    {"chapter": "Chapter 1", "section": "Licence classes", "page": 3, "level": 2},
    {"chapter": "Chapter 1", "section": "Medical fitness", "page": 5, "level": 2},
    {"chapter": "Chapter 1", "section": "Vision", "page": 5, "level": 2},
    {"chapter": "Chapter 1", "section": "Air brake endorsement", "page": 5, "level": 2},
    {"chapter": "Chapter 1", "section": "How to apply for an air brake endorsement", "page": 5, "level": 2},
    {"chapter": "Chapter 1", "section": "How to apply for a Class 1, 2, 3 or 4 driver's licence", "page": 6, "level": 2},
    {"chapter": "Chapter 1", "section": "How to apply for a heavy trailer endorsement", "page": 7, "level": 2},
    {"chapter": "Chapter 1", "section": "Knowledge tests", "page": 8, "level": 2},
    {"chapter": "Chapter 1", "section": "Road testing", "page": 8, "level": 2},
    {"chapter": "Chapter 1", "section": "Pre-trip inspection test", "page": 9, "level": 2},
    {"chapter": "Chapter 1", "section": "Road test", "page": 10, "level": 2},
    {"chapter": "Chapter 1", "section": "Road test vehicles", "page": 10, "level": 2},
    {"chapter": "Chapter 1", "section": "Strategies to ensure your vehicle is safe", "page": 11, "level": 2},
    {"chapter": "Chapter 1", "section": "Retest", "page": 12, "level": 2},
    {"chapter": "Chapter 1", "section": "Commercial driver training", "page": 12, "level": 2},
    {"chapter": "Chapter 1", "section": "Air brake courses", "page": 13, "level": 2},
    {"chapter": "Chapter 1", "section": "Keeping your licence", "page": 13, "level": 2},
    {"chapter": "Chapter 1", "section": "Review questions", "page": 14, "level": 2},
    
    # Chapter 2: Heavy vehicle braking
    {"chapter": "Chapter 2", "section": "Heavy vehicle braking", "page": 15, "level": 1},
    {"chapter": "Chapter 2", "section": "What you'll learn", "page": 15, "level": 2},
    {"chapter": "Chapter 2", "section": "Heat and friction", "page": 15, "level": 2},
    {"chapter": "Chapter 2", "section": "Stopping distance", "page": 16, "level": 2},
    {"chapter": "Chapter 2", "section": "Total stopping distance", "page": 17, "level": 2},
    {"chapter": "Chapter 2", "section": "Perception time", "page": 17, "level": 2},
    {"chapter": "Chapter 2", "section": "Reaction time", "page": 17, "level": 2},
    {"chapter": "Chapter 2", "section": "Brake lag time", "page": 17, "level": 2},
    {"chapter": "Chapter 2", "section": "Braking distance", "page": 18, "level": 2},
    {"chapter": "Chapter 2", "section": "Speed", "page": 18, "level": 2},
    {"chapter": "Chapter 2", "section": "Weight", "page": 19, "level": 2},
    {"chapter": "Chapter 2", "section": "Brake condition", "page": 19, "level": 2},
    {"chapter": "Chapter 2", "section": "Tire condition", "page": 20, "level": 2},
    {"chapter": "Chapter 2", "section": "Road conditions", "page": 20, "level": 2},
    {"chapter": "Chapter 2", "section": "Braking", "page": 21, "level": 2},
    {"chapter": "Chapter 2", "section": "Icy roads", "page": 21, "level": 2},
    {"chapter": "Chapter 2", "section": "Downgrades", "page": 21, "level": 2},
    {"chapter": "Chapter 2", "section": "Water on roadways", "page": 23, "level": 2},
    {"chapter": "Chapter 2", "section": "Runaway lanes", "page": 23, "level": 2},
    {"chapter": "Chapter 2", "section": "Combination unit braking", "page": 23, "level": 2},
    {"chapter": "Chapter 2", "section": "Anti-lock braking systems", "page": 23, "level": 2},
    {"chapter": "Chapter 2", "section": "Automatic traction control", "page": 25, "level": 2},
    {"chapter": "Chapter 2", "section": "Review questions", "page": 25, "level": 2},
    
    # Chapter 3: Basic driving skills
    {"chapter": "Chapter 3", "section": "Basic driving skills", "page": 27, "level": 1},
    {"chapter": "Chapter 3", "section": "What you'll learn", "page": 27, "level": 2},
    {"chapter": "Chapter 3", "section": "Sharing the road", "page": 27, "level": 2},
    {"chapter": "Chapter 3", "section": "Following distance", "page": 27, "level": 2},
    {"chapter": "Chapter 3", "section": "Traffic flow", "page": 28, "level": 2},
    {"chapter": "Chapter 3", "section": "Tailgaters", "page": 29, "level": 2},
    {"chapter": "Chapter 3", "section": "Construction zones", "page": 30, "level": 2},
    {"chapter": "Chapter 3", "section": "Danger zones", "page": 30, "level": 2},
    {"chapter": "Chapter 3", "section": "Manoeuvring", "page": 31, "level": 2},
    {"chapter": "Chapter 3", "section": "Steering into turns", "page": 31, "level": 2},
    {"chapter": "Chapter 3", "section": "Wheel positions during turns", "page": 31, "level": 2},
    {"chapter": "Chapter 3", "section": "Turning radius", "page": 31, "level": 2},
    {"chapter": "Chapter 3", "section": "Off track", "page": 32, "level": 2},
    {"chapter": "Chapter 3", "section": "Wide turns", "page": 32, "level": 2},
    {"chapter": "Chapter 3", "section": "Difficult turns", "page": 33, "level": 2},
    {"chapter": "Chapter 3", "section": "Speed", "page": 34, "level": 2},
    {"chapter": "Chapter 3", "section": "Acceleration", "page": 35, "level": 2},
    {"chapter": "Chapter 3", "section": "Braking", "page": 35, "level": 2},
    {"chapter": "Chapter 3", "section": "Rollover", "page": 36, "level": 2},
    {"chapter": "Chapter 3", "section": "Hills", "page": 37, "level": 2},
    {"chapter": "Chapter 3", "section": "Space management", "page": 38, "level": 2},
    {"chapter": "Chapter 3", "section": "Backing up", "page": 40, "level": 2},
    {"chapter": "Chapter 3", "section": "Driving defensively", "page": 41, "level": 2},
    {"chapter": "Chapter 3", "section": "Seeing and being seen", "page": 42, "level": 2},
    {"chapter": "Chapter 3", "section": "Using your mirrors", "page": 43, "level": 2},
    {"chapter": "Chapter 3", "section": "Looking ahead", "page": 43, "level": 2},
    {"chapter": "Chapter 3", "section": "Which lane should you use?", "page": 43, "level": 2},
    {"chapter": "Chapter 3", "section": "Lane use", "page": 43, "level": 2},
    {"chapter": "Chapter 3", "section": "Emergency vehicles", "page": 44, "level": 2},
    {"chapter": "Chapter 3", "section": "Stopped vehicles with flashing lights", "page": 44, "level": 2},
    {"chapter": "Chapter 3", "section": "Shifting gears", "page": 44, "level": 2},
    {"chapter": "Chapter 3", "section": "Knowing how to shift gears", "page": 45, "level": 2},
    {"chapter": "Chapter 3", "section": "Double-clutching", "page": 45, "level": 2},
    {"chapter": "Chapter 3", "section": "Knowing when to shift gears", "page": 45, "level": 2},
    {"chapter": "Chapter 3", "section": "Shifting skills", "page": 46, "level": 2},
    {"chapter": "Chapter 3", "section": "Multi-speed rear axles and auxiliary transmissions", "page": 47, "level": 2},
    {"chapter": "Chapter 3", "section": "Entering curves", "page": 47, "level": 2},
    {"chapter": "Chapter 3", "section": "Passing and being passed", "page": 47, "level": 2},
    {"chapter": "Chapter 3", "section": "Parking", "page": 48, "level": 2},
    {"chapter": "Chapter 3", "section": "Crossings", "page": 49, "level": 2},
    {"chapter": "Chapter 3", "section": "Intersections", "page": 49, "level": 2},
    {"chapter": "Chapter 3", "section": "Alleys, lanes and side roads", "page": 50, "level": 2},
    {"chapter": "Chapter 3", "section": "Railway crossings", "page": 51, "level": 2},
    {"chapter": "Chapter 3", "section": "Acts of nature", "page": 53, "level": 2},
    {"chapter": "Chapter 3", "section": "Animals on the road", "page": 53, "level": 2},
    {"chapter": "Chapter 3", "section": "Weather conditions", "page": 53, "level": 2},
    {"chapter": "Chapter 3", "section": "Driving in fog", "page": 54, "level": 2},
    {"chapter": "Chapter 3", "section": "Driving in rain", "page": 55, "level": 2},
    {"chapter": "Chapter 3", "section": "Driving in snow", "page": 55, "level": 2},
    {"chapter": "Chapter 3", "section": "Driving in wind", "page": 56, "level": 2},
    {"chapter": "Chapter 3", "section": "Driving at night", "page": 57, "level": 2},
    {"chapter": "Chapter 3", "section": "Driving in mountains", "page": 58, "level": 2},
    {"chapter": "Chapter 3", "section": "Personal safety", "page": 59, "level": 2},
    {"chapter": "Chapter 3", "section": "Carbon monoxide poisoning", "page": 59, "level": 2},
    {"chapter": "Chapter 3", "section": "Seatbelts", "page": 59, "level": 2},
    {"chapter": "Chapter 3", "section": "Airbags and head restraints", "page": 60, "level": 2},
    {"chapter": "Chapter 3", "section": "Cellphones and other devices", "page": 60, "level": 2},
    {"chapter": "Chapter 3", "section": "Impairment", "page": 61, "level": 2},
    {"chapter": "Chapter 3", "section": "Fatigue", "page": 63, "level": 2},
    {"chapter": "Chapter 3", "section": "Fire", "page": 63, "level": 2},
    {"chapter": "Chapter 3", "section": "Firefighting", "page": 64, "level": 2},
    {"chapter": "Chapter 3", "section": "Fire extinguishers", "page": 64, "level": 2},
    {"chapter": "Chapter 3", "section": "Review questions", "page": 65, "level": 2},
    
    # Chapter 4: Fuel-efficient driving
    {"chapter": "Chapter 4", "section": "Fuel-efficient driving", "page": 67, "level": 1},
    {"chapter": "Chapter 4", "section": "What you'll learn", "page": 67, "level": 2},
    {"chapter": "Chapter 4", "section": "Fuel efficiency — a growing priority", "page": 67, "level": 2},
    {"chapter": "Chapter 4", "section": "Making smart choices", "page": 67, "level": 2},
    {"chapter": "Chapter 4", "section": "Smart driving practices", "page": 67, "level": 2},
    {"chapter": "Chapter 4", "section": "Preparation and planning", "page": 68, "level": 2},
    {"chapter": "Chapter 4", "section": "Smart driving techniques", "page": 69, "level": 2},
    {"chapter": "Chapter 4", "section": "Vehicle maintenance", "page": 71, "level": 2},
    {"chapter": "Chapter 4", "section": "Review questions", "page": 73, "level": 2},
    
    # Chapter 5: Skills for driving trucks and trailers
    {"chapter": "Chapter 5", "section": "Skills for driving trucks and trailers", "page": 75, "level": 1},
    {"chapter": "Chapter 5", "section": "What you'll learn", "page": 75, "level": 2},
    {"chapter": "Chapter 5", "section": "Driving with a trailer", "page": 75, "level": 2},
    {"chapter": "Chapter 5", "section": "Backing up", "page": 75, "level": 2},
    {"chapter": "Chapter 5", "section": "Towing trailers", "page": 76, "level": 2},
    {"chapter": "Chapter 5", "section": "Towing doubles", "page": 76, "level": 2},
    {"chapter": "Chapter 5", "section": "Swerving and whipping", "page": 77, "level": 2},
    {"chapter": "Chapter 5", "section": "Parking", "page": 78, "level": 2},
    {"chapter": "Chapter 5", "section": "Preparing to tow", "page": 78, "level": 2},
    {"chapter": "Chapter 5", "section": "Coupling and uncoupling", "page": 78, "level": 2},
    {"chapter": "Chapter 5", "section": "Coupling with a fifth wheel", "page": 78, "level": 2},
    {"chapter": "Chapter 5", "section": "Uncoupling units", "page": 83, "level": 2},
    {"chapter": "Chapter 5", "section": "Other types of connections", "page": 85, "level": 2},
    {"chapter": "Chapter 5", "section": "Coupling with a pintle hitch", "page": 85, "level": 2},
    {"chapter": "Chapter 5", "section": "Uncoupling pintle hitch units", "page": 88, "level": 2},
    {"chapter": "Chapter 5", "section": "Loading", "page": 89, "level": 2},
    {"chapter": "Chapter 5", "section": "Loading cargo", "page": 89, "level": 2},
    {"chapter": "Chapter 5", "section": "Arranging and distributing loads", "page": 90, "level": 2},
    {"chapter": "Chapter 5", "section": "Securing cargo", "page": 92, "level": 2},
    {"chapter": "Chapter 5", "section": "General cargo securement requirements", "page": 92, "level": 2},
    {"chapter": "Chapter 5", "section": "General requirements for tiedowns", "page": 93, "level": 2},
    {"chapter": "Chapter 5", "section": "Specific cargo types", "page": 102, "level": 2},
    {"chapter": "Chapter 5", "section": "Logs", "page": 102, "level": 2},
    {"chapter": "Chapter 5", "section": "Metal coils", "page": 105, "level": 2},
    {"chapter": "Chapter 5", "section": "Paper rolls", "page": 106, "level": 2},
    {"chapter": "Chapter 5", "section": "Concrete pipe", "page": 107, "level": 2},
    {"chapter": "Chapter 5", "section": "Intermodal containers", "page": 108, "level": 2},
    {"chapter": "Chapter 5", "section": "Automobiles, light trucks and vans", "page": 109, "level": 2},
    {"chapter": "Chapter 5", "section": "Heavy vehicles, equipment and machinery", "page": 109, "level": 2},
    {"chapter": "Chapter 5", "section": "Flattened or crushed vehicles", "page": 110, "level": 2},
    {"chapter": "Chapter 5", "section": "Vehicle dimensions and weight", "page": 110, "level": 2},
    {"chapter": "Chapter 5", "section": "Height", "page": 110, "level": 2},
    {"chapter": "Chapter 5", "section": "Width", "page": 110, "level": 2},
    {"chapter": "Chapter 5", "section": "Length", "page": 111, "level": 2},
    {"chapter": "Chapter 5", "section": "Weight", "page": 111, "level": 2},
    {"chapter": "Chapter 5", "section": "Oversize and overload permits", "page": 111, "level": 2},
    {"chapter": "Chapter 5", "section": "Reporting to weigh scales", "page": 113, "level": 2},
    {"chapter": "Chapter 5", "section": "Review questions", "page": 115, "level": 2},
    
    # Chapter 6: Skills for driving buses, taxis, limousines and ride-hailing vehicles
    {"chapter": "Chapter 6", "section": "Skills for driving buses, taxis, limousines and ride-hailing vehicles", "page": 117, "level": 1},
    {"chapter": "Chapter 6", "section": "What you'll learn", "page": 117, "level": 2},
    {"chapter": "Chapter 6", "section": "Passenger safety", "page": 118, "level": 2},
    {"chapter": "Chapter 6", "section": "Manoeuvring", "page": 119, "level": 2},
    {"chapter": "Chapter 6", "section": "Leaving the curb", "page": 119, "level": 2},
    {"chapter": "Chapter 6", "section": "Bus right-of-way", "page": 120, "level": 2},
    {"chapter": "Chapter 6", "section": "Passing parked cars", "page": 120, "level": 2},
    {"chapter": "Chapter 6", "section": "Operating a bus, taxi, limousine or ride-hailing vehicle", "page": 121, "level": 2},
    {"chapter": "Chapter 6", "section": "Taking on and letting off passengers", "page": 121, "level": 2},
    {"chapter": "Chapter 6", "section": "Smoking", "page": 121, "level": 2},
    {"chapter": "Chapter 6", "section": "Focus on driving", "page": 121, "level": 2},
    {"chapter": "Chapter 6", "section": "Standing passengers", "page": 121, "level": 2},
    {"chapter": "Chapter 6", "section": "Refusing to transport passengers", "page": 122, "level": 2},
    {"chapter": "Chapter 6", "section": "Let-down or jump seats", "page": 122, "level": 2},
    {"chapter": "Chapter 6", "section": "Accessibility aids and equipment", "page": 122, "level": 2},
    {"chapter": "Chapter 6", "section": "Personal safety", "page": 123, "level": 2},
    {"chapter": "Chapter 6", "section": "Operating a school bus", "page": 125, "level": 2},
    {"chapter": "Chapter 6", "section": "Brake maintenance", "page": 125, "level": 2},
    {"chapter": "Chapter 6", "section": "Mechanical defects", "page": 125, "level": 2},
    {"chapter": "Chapter 6", "section": "Refuelling", "page": 126, "level": 2},
    {"chapter": "Chapter 6", "section": "Emergency equipment and exits", "page": 126, "level": 2},
    {"chapter": "Chapter 6", "section": "School bus signs", "page": 126, "level": 2},
    {"chapter": "Chapter 6", "section": "Exterior mirrors", "page": 126, "level": 2},
    {"chapter": "Chapter 6", "section": "Passengers must be seated", "page": 126, "level": 2},
    {"chapter": "Chapter 6", "section": "Cleanliness", "page": 127, "level": 2},
    {"chapter": "Chapter 6", "section": "Operating emergency vehicles", "page": 127, "level": 2},
    {"chapter": "Chapter 6", "section": "Review questions", "page": 129, "level": 2},
    
    # Chapter 7: Hours of service requirements
    {"chapter": "Chapter 7", "section": "Hours of service requirements", "page": 131, "level": 1},
    {"chapter": "Chapter 7", "section": "What you'll learn", "page": 131, "level": 2},
    {"chapter": "Chapter 7", "section": "National Safety Code", "page": 131, "level": 2},
    {"chapter": "Chapter 7", "section": "Hours of service", "page": 131, "level": 2},
    {"chapter": "Chapter 7", "section": "On-duty time", "page": 132, "level": 2},
    {"chapter": "Chapter 7", "section": "Off-duty time", "page": 132, "level": 2},
    {"chapter": "Chapter 7", "section": "Day", "page": 132, "level": 2},
    {"chapter": "Chapter 7", "section": "Daily limits — a simple three-point check for compliance", "page": 133, "level": 2},
    {"chapter": "Chapter 7", "section": "Work shift", "page": 133, "level": 2},
    {"chapter": "Chapter 7", "section": "Daily hours (cycles)", "page": 133, "level": 2},
    {"chapter": "Chapter 7", "section": "Deferring off-duty time", "page": 134, "level": 2},
    {"chapter": "Chapter 7", "section": "Reset provision", "page": 134, "level": 2},
    {"chapter": "Chapter 7", "section": "Sleeper berth", "page": 134, "level": 2},
    {"chapter": "Chapter 7", "section": "Personal use exemption", "page": 136, "level": 2},
    {"chapter": "Chapter 7", "section": "Logbooks", "page": 136, "level": 2},
    {"chapter": "Chapter 7", "section": "Drivers operating within 160 km of home terminal", "page": 138, "level": 2},
    {"chapter": "Chapter 7", "section": "Other jurisdictions", "page": 138, "level": 2},
    {"chapter": "Chapter 7", "section": "Driving into the United States", "page": 138, "level": 2},
    {"chapter": "Chapter 7", "section": "Review questions", "page": 139, "level": 2},
    
    # Chapter 8: Air brakes
    {"chapter": "Chapter 8", "section": "Air brakes", "page": 141, "level": 1},
    {"chapter": "Chapter 8", "section": "What you'll learn", "page": 141, "level": 2},
    {"chapter": "Chapter 8", "section": "Basic air brake components", "page": 142, "level": 2},
    {"chapter": "Chapter 8", "section": "Force multipliers", "page": 143, "level": 2},
    {"chapter": "Chapter 8", "section": "Air brake chamber components", "page": 143, "level": 2},
    {"chapter": "Chapter 8", "section": "Leverage and air pressure", "page": 144, "level": 2},
    {"chapter": "Chapter 8", "section": "Long stroke and regular stroke brake chambers", "page": 144, "level": 2},
    {"chapter": "Chapter 8", "section": "Foundation brakes: s-cam type", "page": 145, "level": 2},
    {"chapter": "Chapter 8", "section": "Compressor", "page": 146, "level": 2},
    {"chapter": "Chapter 8", "section": "Governor", "page": 148, "level": 2},
    {"chapter": "Chapter 8", "section": "Reservoirs", "page": 149, "level": 2},
    {"chapter": "Chapter 8", "section": "Foot valve", "page": 149, "level": 2},
    {"chapter": "Chapter 8", "section": "How air brakes work", "page": 150, "level": 2},
    {"chapter": "Chapter 8", "section": "Brakes applied", "page": 150, "level": 2},
    {"chapter": "Chapter 8", "section": "Brakes released", "page": 151, "level": 2},
    {"chapter": "Chapter 8", "section": "Dual air brake systems", "page": 151, "level": 2},
    {"chapter": "Chapter 8", "section": "Components of a dual air brake system", "page": 152, "level": 2},
    {"chapter": "Chapter 8", "section": "Supply, primary and secondary reservoirs", "page": 152, "level": 2},
    {"chapter": "Chapter 8", "section": "One-way check valve", "page": 152, "level": 2},
    {"chapter": "Chapter 8", "section": "Reservoir pressure gauges", "page": 153, "level": 2},
    {"chapter": "Chapter 8", "section": "Low-air warning device", "page": 153, "level": 2},
    {"chapter": "Chapter 8", "section": "Quick release valve", "page": 154, "level": 2},
    {"chapter": "Chapter 8", "section": "Relay valve", "page": 155, "level": 2},
    {"chapter": "Chapter 8", "section": "Dual system with primary system failure", "page": 156, "level": 2},
    {"chapter": "Chapter 8", "section": "Parking brakes", "page": 156, "level": 2},
    {"chapter": "Chapter 8", "section": "Spring parking brakes", "page": 157, "level": 2},
    {"chapter": "Chapter 8", "section": "Applying and releasing spring parking brakes", "page": 158, "level": 2},
    {"chapter": "Chapter 8", "section": "Compounding", "page": 160, "level": 2},
    {"chapter": "Chapter 8", "section": "Modulating valve", "page": 161, "level": 2},
    {"chapter": "Chapter 8", "section": "Trailer brakes", "page": 162, "level": 2},
    {"chapter": "Chapter 8", "section": "Trailer air supply components", "page": 163, "level": 2},
    {"chapter": "Chapter 8", "section": "Trailer service brake", "page": 165, "level": 2},
    {"chapter": "Chapter 8", "section": "Trailer with spring parking brakes", "page": 166, "level": 2},
    {"chapter": "Chapter 8", "section": "Tractor protection", "page": 168, "level": 2},
    {"chapter": "Chapter 8", "section": "Trailer air supply valve", "page": 169, "level": 2},
    {"chapter": "Chapter 8", "section": "Hand valve", "page": 169, "level": 2},
    {"chapter": "Chapter 8", "section": "Two-way check valve", "page": 170, "level": 2},
    {"chapter": "Chapter 8", "section": "Bobtail tractors", "page": 170, "level": 2},
    {"chapter": "Chapter 8", "section": "Other types of foundation brakes", "page": 173, "level": 2},
    {"chapter": "Chapter 8", "section": "Wedge brakes", "page": 174, "level": 2},
    {"chapter": "Chapter 8", "section": "Air disc brakes", "page": 174, "level": 2},
    {"chapter": "Chapter 8", "section": "Air-over-hydraulic brakes", "page": 175, "level": 2},
    {"chapter": "Chapter 8", "section": "Other air brake system components", "page": 176, "level": 2},
    {"chapter": "Chapter 8", "section": "Air dryers", "page": 176, "level": 2},
    {"chapter": "Chapter 8", "section": "Alcohol evaporators and alcohol injectors", "page": 177, "level": 2},
    {"chapter": "Chapter 8", "section": "Automatic drain valves", "page": 178, "level": 2},
    {"chapter": "Chapter 8", "section": "Front wheel limiting systems", "page": 178, "level": 2},
    {"chapter": "Chapter 8", "section": "Spring parking brake emergency release system", "page": 179, "level": 2},
    {"chapter": "Chapter 8", "section": "Pressure-protection valves", "page": 180, "level": 2},
    {"chapter": "Chapter 8", "section": "Application pressure gauges", "page": 180, "level": 2},
    {"chapter": "Chapter 8", "section": "Anti-lock braking systems", "page": 180, "level": 2},
    {"chapter": "Chapter 8", "section": "Trailer ABS air brake systems", "page": 182, "level": 2},
    {"chapter": "Chapter 8", "section": "Review questions", "page": 183, "level": 2},
    
    # Chapter 9: Air brake adjustment
    {"chapter": "Chapter 9", "section": "Air brake adjustment", "page": 185, "level": 1},
    {"chapter": "Chapter 9", "section": "What you'll learn", "page": 185, "level": 2},
    {"chapter": "Chapter 9", "section": "Brake adjustment — it's critical", "page": 185, "level": 2},
    {"chapter": "Chapter 9", "section": "Checking brake adjustment", "page": 186, "level": 2},
    {"chapter": "Chapter 9", "section": "The pry bar/mark method", "page": 187, "level": 2},
    {"chapter": "Chapter 9", "section": "The applied stroke method", "page": 188, "level": 2},
    {"chapter": "Chapter 9", "section": "S-cam brakes — manual slack adjuster", "page": 189, "level": 2},
    {"chapter": "Chapter 9", "section": "Adjusting manual slack adjusters", "page": 189, "level": 2},
    {"chapter": "Chapter 9", "section": "S-cam brakes — automatic slack adjuster", "page": 191, "level": 2},
    {"chapter": "Chapter 9", "section": "Checking and adjusting automatic slack adjusters", "page": 191, "level": 2},
    {"chapter": "Chapter 9", "section": "Air brake adjustment myths", "page": 193, "level": 2},
    {"chapter": "Chapter 9", "section": "Review questions", "page": 194, "level": 2},
    
    # Chapter 10: Vehicle and air brake pre-trip inspections
    {"chapter": "Chapter 10", "section": "Vehicle and air brake pre-trip inspections", "page": 195, "level": 1},
    {"chapter": "Chapter 10", "section": "What you'll learn", "page": 195, "level": 2},
    {"chapter": "Chapter 10", "section": "You're responsible", "page": 195, "level": 2},
    {"chapter": "Chapter 10", "section": "Vehicle condition", "page": 196, "level": 2},
    {"chapter": "Chapter 10", "section": "Cargo securement", "page": 196, "level": 2},
    {"chapter": "Chapter 10", "section": "Written report requirements", "page": 197, "level": 2},
    {"chapter": "Chapter 10", "section": "Pre-trip inspection report for your road test", "page": 197, "level": 2},
    {"chapter": "Chapter 10", "section": "Conducting a pre-trip inspection", "page": 199, "level": 2},
    {"chapter": "Chapter 10", "section": "Tractor-trailer combination pre-trip inspection — Class 1", "page": 200, "level": 2},
    {"chapter": "Chapter 10", "section": "Under hood", "page": 201, "level": 2},
    {"chapter": "Chapter 10", "section": "In cab", "page": 202, "level": 2},
    {"chapter": "Chapter 10", "section": "Air brake system test", "page": 204, "level": 2},
    {"chapter": "Chapter 10", "section": "Circle check for lights", "page": 205, "level": 2},
    {"chapter": "Chapter 10", "section": "Mechanical circle check", "page": 205, "level": 2},
    {"chapter": "Chapter 10", "section": "Brake response, tug and steering wheel slack tests", "page": 209, "level": 2},
    {"chapter": "Chapter 10", "section": "Single unit truck pre-trip inspection — Class 3", "page": 210, "level": 2},
    {"chapter": "Chapter 10", "section": "Bus pre-trip inspection — Class 2 or Class 4", "page": 218, "level": 2},
    {"chapter": "Chapter 10", "section": "Pre-hill inspections", "page": 228, "level": 2},
    {"chapter": "Chapter 10", "section": "In-service brake checks", "page": 229, "level": 2},
    {"chapter": "Chapter 10", "section": "En route inspections", "page": 229, "level": 2},
    {"chapter": "Chapter 10", "section": "Post-trip inspections", "page": 230, "level": 2},
    {"chapter": "Chapter 10", "section": "Lights and reflectors", "page": 230, "level": 2},
    {"chapter": "Chapter 10", "section": "Review questions", "page": 232, "level": 2},
    
    # Chapter 11: Signs, signals and road markings
    {"chapter": "Chapter 11", "section": "Signs, signals and road markings", "page": 233, "level": 1},
    {"chapter": "Chapter 11", "section": "Signs", "page": 233, "level": 2},
    {"chapter": "Chapter 11", "section": "Regulatory signs", "page": 234, "level": 2},
    {"chapter": "Chapter 11", "section": "School, playground and crosswalk signs", "page": 235, "level": 2},
    {"chapter": "Chapter 11", "section": "Lane use signs", "page": 235, "level": 2},
    {"chapter": "Chapter 11", "section": "Turn control signs", "page": 236, "level": 2},
    {"chapter": "Chapter 11", "section": "Parking signs", "page": 236, "level": 2},
    {"chapter": "Chapter 11", "section": "Reserved lane signs", "page": 236, "level": 2},
    {"chapter": "Chapter 11", "section": "Warning signs", "page": 237, "level": 2},
    {"chapter": "Chapter 11", "section": "Object markers", "page": 238, "level": 2},
    {"chapter": "Chapter 11", "section": "Construction signs", "page": 239, "level": 2},
    {"chapter": "Chapter 11", "section": "Information and destination signs", "page": 239, "level": 2},
    {"chapter": "Chapter 11", "section": "Railway signs", "page": 240, "level": 2},
    {"chapter": "Chapter 11", "section": "Signals", "page": 240, "level": 2},
    {"chapter": "Chapter 11", "section": "Lane control signals", "page": 240, "level": 2},
    {"chapter": "Chapter 11", "section": "Traffic lights", "page": 241, "level": 2},
    {"chapter": "Chapter 11", "section": "Road markings", "page": 242, "level": 2},
    {"chapter": "Chapter 11", "section": "Yellow lines", "page": 242, "level": 2},
    {"chapter": "Chapter 11", "section": "White lines", "page": 243, "level": 2},
    {"chapter": "Chapter 11", "section": "Reserved lane markings", "page": 244, "level": 2},
    {"chapter": "Chapter 11", "section": "Other markings", "page": 244, "level": 2},
    {"chapter": "Chapter 11", "section": "Review questions", "page": 245, "level": 2},
    
    # Chapter 12: Industrial roads
    {"chapter": "Chapter 12", "section": "Industrial roads", "page": 246, "level": 1},
    {"chapter": "Chapter 12", "section": "What you'll learn", "page": 246, "level": 2},
    {"chapter": "Chapter 12", "section": "Operating on industrial roads", "page": 246, "level": 2},
    {"chapter": "Chapter 12", "section": "Right-of-way", "page": 250, "level": 2},
    {"chapter": "Chapter 12", "section": "Warning signals", "page": 250, "level": 2},
    {"chapter": "Chapter 12", "section": "Railway crossings", "page": 250, "level": 2},
    {"chapter": "Chapter 12", "section": "Safety tips", "page": 250, "level": 2},
    {"chapter": "Chapter 12", "section": "Highway crossing permits", "page": 250, "level": 2},
    {"chapter": "Chapter 12", "section": "Review questions", "page": 251, "level": 2},
    
    # Chapter 13: For more information
    {"chapter": "Chapter 13", "section": "For more information", "page": 253, "level": 1},
    {"chapter": "Chapter 13", "section": "Dangerous goods", "page": 253, "level": 2},
    {"chapter": "Chapter 13", "section": "Federal contacts", "page": 253, "level": 2},
    {"chapter": "Chapter 13", "section": "Commercial vehicle information", "page": 254, "level": 2},
    {"chapter": "Chapter 13", "section": "Passenger transportation branch", "page": 255, "level": 2},
    {"chapter": "Chapter 13", "section": "Licensing information", "page": 255, "level": 2},
    {"chapter": "Chapter 13", "section": "Medical qualifications", "page": 256, "level": 2},
    {"chapter": "Chapter 13", "section": "More information", "page": 256, "level": 2},
    {"chapter": "Chapter 13", "section": "TaxiHost", "page": 258, "level": 2},
    {"chapter": "Chapter 13", "section": "Metric conversion table", "page": 259, "level": 2},
]


def generate_sections_json():
    """生成 sections JSON 文件"""
    output = []
    
    for idx, s in enumerate(SECTIONS_DATA):
        # 计算实际 PDF 页码
        page_start = s["page"] + PAGE_OFFSET
        
        output.append({
            "id": idx + 1,
            "chapter": s["chapter"],
            "section": s["section"],
            "page_start": page_start,
            "page_end": page_start,  # 单页
            "level": s["level"],
            "content": ""  # 内容后续可以从 PDF 提取
        })
    
    return output


def main():
    sections = generate_sections_json()
    
    # 保存到文件
    output_file = Path(__file__).parent.parent.parent.parent.parent / "icbc_sections_toc.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sections, f, ensure_ascii=False, indent=2)
    
    # 统计
    level1 = len([s for s in sections if s["level"] == 1])
    level2 = len([s for s in sections if s["level"] == 2])
    
    print(f"总条目数: {len(sections)}")
    print(f"  - 章节 (level=1): {level1}")
    print(f"  - 小节 (level=2): {level2}")
    print(f"已保存到: {output_file}")
    
    # 按章节统计
    print("\n各章节小节数:")
    for i in range(1, 14):
        chapter_sections = [s for s in sections if s["chapter"] == f"Chapter {i}"]
        print(f"  Chapter {i}: {len(chapter_sections)} 条")


if __name__ == "__main__":
    main()
