import datetime
from app.models.study_progress import StudyProgress

# SM-2 Algorithm parameters
EASE_FACTOR_MIN = 1.3
GRADE_MAP = {
    "again": 0,    # Complete blackout
    "hard": 2,     # Correct but hard
    "good": 4,     # Correct with hesitation
    "easy": 5      # Perfect response
}

def update_srs(progress: StudyProgress, grade_str: str) -> StudyProgress:
    """
    Updates the study progress based on a modified SM-2 algorithm.
    """
    grade = GRADE_MAP.get(grade_str, 0)
    
    # Update counts
    progress.review_count += 1
    if grade >= 3:
        progress.correct_count += 1
    else:
        progress.wrong_count += 1

    # If the user failed, reset the repetition count (level)
    if grade < 3:
        progress.level = 0
        interval = 1
    else:
        if progress.level == 0:
            interval = 1
        elif progress.level == 1:
            interval = 6
        else:
            # Previous interval is needed, approximate from level (level 0=1, 1=6, 2=6*EF, etc.)
            # Here we just use a simplified interval calculation based on level
            interval = int(6 * (progress.ease_factor ** (progress.level - 1)))
        progress.level += 1

    # Update ease factor
    # EF':= EF+(0.1-(5-q)*(0.08+(5-q)*0.02))
    new_ef = progress.ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    progress.ease_factor = max(EASE_FACTOR_MIN, new_ef)

    # Set next review time
    progress.next_review_time = datetime.datetime.utcnow() + datetime.timedelta(days=interval)
    
    return progress
