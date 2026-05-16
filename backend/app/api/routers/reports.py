from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import datetime

from app.db.base import get_db
from app.api.deps import get_current_active_user
from app.models.event import Event, EventDoctor, EventCost, EventMeal
from app.models.user import User, Division, Entity

router = APIRouter(prefix="/reports", tags=["reports"])


def _get_user_division_ids(db: Session, user: User) -> Optional[List[int]]:
    """
    Returns list of division IDs the user can access, or None if admin (meaning all).
    """
    if user.is_superuser or user.role == "Administrator":
        return None  # No filter — admin sees everything

    div_ids = set()
    if user.division_id:
        div_ids.add(user.division_id)
    if user.division_assignments:
        for da in user.division_assignments:
            div_ids.add(da.division_id)

    return list(div_ids) if div_ids else []


@router.get("/events")
def event_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    division_id: Optional[int] = None,
    status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
):
    """
    Event Report — matches EventReport.xlsx columns:
    CompanyName, Division, EventCode, EventType, EventCategory, SponsorshipType,
    EventTitle, EventTopic, EventStartDate, EventEndDate, EventCity, EventVenue,
    PlatformOfEvent, TotalCost, EventCost, HonorariumAmount, EventStatus,
    ApprovalStatus, InitiatorName, InitiatedDate, Speakers, Brand, Count
    """
    query = (
        db.query(Event)
        .options(
            joinedload(Event.initiator),
            joinedload(Event.doctors),
            joinedload(Event.meals),
        )
        .join(Event.initiator)
    )

    # Apply division-based access control
    user_div_ids = _get_user_division_ids(db, current_user)
    if user_div_ids is not None:
        if not user_div_ids:
            return []  # User has no divisions assigned
        query = query.filter(Event.division_id.in_(user_div_ids))

    if division_id:
        query = query.filter(Event.division_id == division_id)
    if status:
        query = query.filter(Event.status == status)
    if from_date:
        query = query.filter(Event.event_date >= datetime.strptime(from_date, "%Y-%m-%d"))
    if to_date:
        query = query.filter(Event.event_date <= datetime.strptime(to_date, "%Y-%m-%d"))

    events = query.order_by(Event.created_at.desc()).all()

    results = []
    for e in events:
        # Get division and entity names
        division_name = ""
        company_name = ""
        if e.division_id:
            div = db.query(Division).filter(Division.id == e.division_id).first()
            if div:
                division_name = div.name
                if div.entity_id:
                    entity = db.query(Entity).filter(Entity.id == div.entity_id).first()
                    if entity:
                        company_name = entity.name

        # Calculate costs
        honorarium_amount = sum(float(d.honorarium or 0) for d in e.doctors)
        total_cost = float(e.total_event_cost or 0) + honorarium_amount
        event_cost = float(e.total_event_cost or 0)

        # Speakers list
        speakers = ", ".join(
            f"{d.sub_application_code or ''}-{d.doctor_name}" if d.sub_application_code else d.doctor_name
            for d in e.doctors
        )

        # Sponsorship type
        sponsorship_type = e.sponsorship_type or ""

        # Initiator name
        initiator_name = ""
        if e.initiator:
            initiator_name = f"{e.initiator.first_name or ''} {e.initiator.last_name or ''}".strip()

        # Approval status mapping
        approval_status = e.status or ""

        results.append({
            "company_name": company_name,
            "division": division_name,
            "event_code": e.event_code,
            "event_type": e.event_type or "",
            "event_category": e.event_category or "",
            "sponsorship_type": sponsorship_type,
            "event_title": e.event_title or "",
            "event_topic": e.topic or "",
            "event_start_date": e.event_date.strftime("%d/%b/%Y") if e.event_date else "",
            "event_end_date": e.event_end_date.strftime("%d/%b/%Y") if e.event_end_date else "",
            "event_city": e.city or "",
            "event_venue": e.venue or "",
            "platform_of_event": e.platform or "",
            "total_cost": total_cost,
            "event_cost": event_cost,
            "honorarium_amount": honorarium_amount,
            "event_status": _get_pre_post_status(e.status),
            "approval_status": approval_status,
            "initiator_name": initiator_name,
            "initiated_date": e.created_at.strftime("%d/%b/%Y") if e.created_at else "",
            "speakers": speakers,
            "brand": e.brand or "",
            "count": len(e.doctors),
        })

    return results


@router.get("/cme-events")
def cme_event_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    division_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
):
    """
    CME Event Report — matches CME-Report.xlsx columns:
    Division, Event code, Event Title, Initiator, Event Date, Type, Name,
    Hotel Name, City, State, Metro, Budget, Count, Emcure Count,
    Food, Audio Video, Hall, Stay, Number of rooms, Cab, Flight, Event, Status, Location
    """
    query = (
        db.query(Event)
        .options(
            joinedload(Event.initiator),
            joinedload(Event.doctors),
            joinedload(Event.costs),
            joinedload(Event.meals),
        )
        .join(Event.initiator)
        .filter(Event.event_type == "CME / RTM")
    )

    # Apply division-based access control
    user_div_ids = _get_user_division_ids(db, current_user)
    if user_div_ids is not None:
        if not user_div_ids:
            return []
        query = query.filter(Event.division_id.in_(user_div_ids))

    if division_id:
        query = query.filter(Event.division_id == division_id)
    if from_date:
        query = query.filter(Event.event_date >= datetime.strptime(from_date, "%Y-%m-%d"))
    if to_date:
        query = query.filter(Event.event_date <= datetime.strptime(to_date, "%Y-%m-%d"))

    events = query.order_by(Event.created_at.desc()).all()

    results = []
    for e in events:
        # Division name
        division_name = ""
        if e.division_id:
            div = db.query(Division).filter(Division.id == e.division_id).first()
            if div:
                division_name = div.name

        # Initiator name
        initiator_name = ""
        if e.initiator:
            initiator_name = f"{e.initiator.first_name or ''} {e.initiator.last_name or ''}".strip()

        # Cost breakdown from event_costs
        food_cost = float(e.total_meal_cost or 0)
        av_cost = float(e.av_platform_cost or 0)
        hall_cost = float(e.venue_charges or 0)
        stay_cost = 0
        num_rooms = 0
        cab_cost = 0
        flight_cost = 0

        # Sum doctor travel costs
        for d in e.doctors:
            cab_cost += float(d.cab_cost or 0)
            flight_cost += float(d.flight_cost or 0)
            stay_cost += float(d.accommodation_cost or 0)

        # If no meal cost from field, calculate from meals
        if food_cost == 0 and e.meals:
            total_attendees = (e.proposed_emcure_attendees or 0) + (e.proposed_num_hcps or 0)
            for meal in e.meals:
                food_cost += float(meal.cost_per_attendee or 0) * total_attendees

        # Budget = total event cost
        budget = float(e.total_event_cost or 0)
        if budget == 0:
            budget = food_cost + av_cost + hall_cost + stay_cost + cab_cost + flight_cost

        results.append({
            "division": division_name,
            "event_code": e.event_code,
            "event_title": e.event_title or "",
            "initiator": initiator_name,
            "event_date": e.event_date.strftime("%m/%d/%Y") if e.event_date else "",
            "type": e.event_type or "",
            "name": e.topic or "",
            "hotel_name": e.venue or "",
            "city": e.city or "",
            "state": e.state or "",
            "metro": "",
            "budget": budget,
            "count": len(e.doctors),
            "emcure_count": e.proposed_emcure_attendees or 0,
            "food": food_cost,
            "audio_video": av_cost,
            "hall": hall_cost,
            "stay": stay_cost,
            "number_of_rooms": num_rooms,
            "cab": cab_cost,
            "flight": flight_cost,
            "event": e.event_category or "",
            "status": e.status or "",
            "location": e.venue or "",
        })

    return results


@router.get("/fmv-parameters")
def fmv_parameter_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
):
    """
    FMV Parameter Report — matches FMVParameterReport.xlsx columns:
    Event Code, PrePost, Status, Sub Application Number, Doctor,
    Hourly Rate, Maximum Capping, Clinical Practice Experience,
    Experience as Investigator, Expertise, Professional Position,
    Prior experience of Congresses, Publications in Literature
    """
    from app.models.master import FmvParameter

    query = (
        db.query(EventDoctor)
        .join(Event, EventDoctor.event_id == Event.id)
        .options(joinedload(EventDoctor.event))
    )

    # Apply division-based access control
    user_div_ids = _get_user_division_ids(db, current_user)
    if user_div_ids is not None:
        if not user_div_ids:
            return []
        query = query.filter(Event.division_id.in_(user_div_ids))

    if from_date:
        query = query.filter(Event.event_date >= datetime.strptime(from_date, "%Y-%m-%d"))
    if to_date:
        query = query.filter(Event.event_date <= datetime.strptime(to_date, "%Y-%m-%d"))

    # Only include doctors that have FMV data filled
    query = query.filter(EventDoctor.fmv_hourly_rate != None)

    doctors = query.order_by(Event.event_code).all()

    # Build a lookup: parameter_name -> { points -> option_label }
    fmv_params = db.query(FmvParameter).filter(FmvParameter.is_active == True).all()
    points_to_label = {}
    for fp in fmv_params:
        if fp.parameter_name not in points_to_label:
            points_to_label[fp.parameter_name] = {}
        points_to_label[fp.parameter_name][fp.points] = fp.option_label

    def get_label(param_name, value):
        """Get the text label for a given parameter's stored value (which is points as string)."""
        if not value and value != 0:
            return ""
        try:
            pts = int(value)
        except (ValueError, TypeError):
            # Already a string label, return as-is
            return str(value)
        if pts == 0:
            return ""
        mapping = points_to_label.get(param_name, {})
        return mapping.get(pts, str(value))

    results = []
    for d in doctors:
        event = d.event
        pre_post = _get_pre_post_status(event.status) if event else ""
        status_label = event.status if event else ""

        # Get text labels for each parameter (stored as numeric points in DB)
        clinical_label = get_label("Clinical Practice Experience", d.fmv_clinical_experience)
        investigator_label = get_label("Experience as an investigator in clinical trials", d.fmv_investigator_experience)
        expertise_label = get_label("Area of Expertise", d.fmv_expertise)
        professional_label = get_label("Professional Position", d.fmv_professional_position)
        congress_label = get_label("Prior experience of Congresses", d.fmv_congress_experience)
        publications_label = get_label("Publications in literature", d.fmv_publications)

        results.append({
            "event_code": event.event_code if event else "",
            "pre_post": pre_post,
            "status": status_label,
            "sub_application_number": d.sub_application_code or "",
            "doctor": f"{d.sub_application_code or ''} {d.doctor_name}".strip(),
            "hourly_rate": float(d.fmv_hourly_rate or 0),
            "maximum_capping": float(d.fmv_max_capping or 0),
            "clinical_practice_experience": clinical_label,
            "experience_as_investigator": investigator_label,
            "expertise": expertise_label,
            "professional_position": professional_label,
            "prior_experience_of_congresses": congress_label,
            "publications_in_literature": publications_label,
        })

    return results


def _get_pre_post_status(status: str) -> str:
    """Map event status to Pre/Post label."""
    if not status:
        return ""
    post_statuses = [
        "Post-Event Pending", "Post L1", "Post L2", "Post Compliance",
        "Post Coordinator", "Post GST", "Post Finance", "Completed",
        "Settled"
    ]
    pre_statuses = [
        "Submitted", "Pending L1", "Pending L2", "Pending Compliance",
        "Pre-Approved", "Approved", "Under Review", "At Level 1",
        "At Level 2"
    ]
    status_lower = status.lower()
    for s in post_statuses:
        if s.lower() in status_lower:
            return "Post"
    for s in pre_statuses:
        if s.lower() in status_lower:
            return "Pre"
    return ""
