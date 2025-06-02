function showModal(modalId) {
      document.getElementById(modalId).style.display = 'block';
    }

    function closeModal(modalId) {
      document.getElementById(modalId).style.display = 'none';
    }

    function showDashboard() {
      document.getElementById('dashboardView').style.display = 'block';
      document.getElementById('volunteerView').style.display = 'none';
    }

    function showVolunteerDetails() {
      document.getElementById('dashboardView').style.display = 'none';
      document.getElementById('volunteerView').style.display = 'block';
    }

    function copyLink() {
      const linkInput = document.getElementById('shareLink');
      linkInput.select();
      document.execCommand('copy');

      const copyBtn = document.querySelector('.copy-btn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    }

    function downloadCSV() {
      const rows = document.querySelectorAll('.volunteer-table tbody tr');
      let csv = 'Name,Course,Year,Email,Phone Number\n';

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).slice(0, 5).map(cell => `"${cell.textContent}"`).join(',');
        csv += rowData + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'volunteers.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }

    document.addEventListener('DOMContentLoaded', function () {
      const taskForm = document.getElementById('taskForm');
      taskForm.addEventListener('submit', function (e) {
        e.preventDefault();
        closeModal('taskModal');
      });

      document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', function () {
          if (confirm('Are you sure you want to remove this volunteer?')) {
            this.closest('tr').remove();
            updateVolunteerCount();
          }
        });
      });

      window.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
          closeModal(e.target.id);
        }
      });
    });

    function updateVolunteerCount() {
      const totalSpots = 5;
      const currentVolunteers = document.querySelectorAll('.volunteer-table tbody tr').length;
      document.querySelector('.volunteer-stats span').textContent =
        `${currentVolunteers}/${totalSpots} Spots filled`;
    }