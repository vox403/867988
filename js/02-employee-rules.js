    function normalizeEmployeeId(value){
      const match = String(value || '').trim().toUpperCase().match(/VT-?\d{6}/);
      if (!match) return '';
      return `VT-${match[0].replace(/[^0-9]/g, '')}`;
    }

    function getSpecialEmployeeLock(employeeId){
      return SPECIAL_EMPLOYEE_LOCKS[normalizeEmployeeId(employeeId)] || null;
    }

    function isSpecialEmployee(employee){
      return !!(employee && !employee.isAdmin && getSpecialEmployeeLock(employee.employeeId));
    }

    function buildSpecialLockedRole(lock, existingRole = {}){
      return {
        ...(existingRole && typeof existingRole === 'object' ? existingRole : {}),
        hrVersion:HR_ROLE_VERSION,
        departmentKey:lock.departmentKey,
        departmentName:lock.departmentName,
        baseTeam:lock.team,
        baseGrade:lock.grade,
        team:lock.team,
        grade:lock.grade,
        employment:lock.team,
        position:lock.grade,
        gradeIndex:-1,
        rewardSeason:'',
        rewardRank:null,
        rewardType:'',
        rewardLabel:'',
        rewardTotalScore:null
      };
    }

    function applySpecialEmployeeLock(employee){
      const lock = employee ? getSpecialEmployeeLock(employee.employeeId) : null;
      if (!lock) return employee;
      const next = employee;
      next.employeeId = normalizeEmployeeId(next.employeeId);
      next.name = lock.displayName;
      next.badge = { src:lock.badgeSrc, label:lock.badgeSrc };
      next.role = buildSpecialLockedRole(lock, next.role);
      return next;
    }

    function displayRoleForEmployee(employee){
      const lock = employee ? getSpecialEmployeeLock(employee.employeeId) : null;
      if (lock) return buildSpecialLockedRole(lock, employee && employee.role ? employee.role : {});
      return normalizeRole(employee && employee.role, employee && employee.badge);
    }


    const badgePool = [
      { src: 'v1.png', label: 'v1.png' },
      { src: 'v2.png', label: 'v2.png' },
      { src: 'v3.png', label: 'v3.png' }
    ];
