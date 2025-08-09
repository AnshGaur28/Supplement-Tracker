import React, { useState, useEffect } from "react";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  isAfter,
  isSameDay,
} from "date-fns";

const USERS = ["Gayatri", "Dinesh"];
const SUPPLEMENTS_PLAN = {
  weekdays: ["Calcium D3 + K2", "Omega-3", "UC-II Collagen"],
  dailyDinesh: ["Magnesium Glycinate"],
};

export default function App() {
  const [user, setUser] = useState(USERS[0]);
  const [todaySupplements, setTodaySupplements] = useState([]);
  const [data, setData] = useState({});
  const [filter, setFilter] = useState("All");

  const [editDate, setEditDate] = useState(null);
  const [editSupplements, setEditSupplements] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const minMonth = startOfMonth(subMonths(new Date(), 2));
  const maxMonth = startOfMonth(new Date());

  useEffect(() => {
    const cached = localStorage.getItem(`supp-${user}`);
    if (cached) setData(JSON.parse(cached));

    fetch(`/api/get?user=${user}`)
      .then((res) => res.json())
      .then((remote) => {
        setData((prev) => {
          const merged = { ...prev, ...remote };
          localStorage.setItem(`supp-${user}`, JSON.stringify(merged));
          return merged;
        });
      });
  }, [user]);

  useEffect(() => {
    if (!selectedDate) return;
    const plan = getPlannedSupplements(selectedDate, user);
    setTodaySupplements(plan);
  }, [selectedDate, user]);

  const toggleSupplementForDate = (date, supp) => {
    const dayData = data[date] || [];
    if (!supp) return;

    const updated = dayData.includes(supp)
      ? dayData.filter((s) => s !== supp)
      : [...dayData, supp];

    const newData = { ...data, [date]: updated };
    setData(newData);
    localStorage.setItem(`supp-${user}`, JSON.stringify(newData));

    fetch("/api/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, date, supplements: updated }),
    });
  };

  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);
  const today = new Date();

  return (
    <Box p={2} maxWidth={600} mx="auto">
      <Typography variant="h5" gutterBottom>
        Supplement Tracker
      </Typography>

      {/* User Select */}
      <Select
        value={user}
        onChange={(e) => setUser(e.target.value)}
        sx={{ mt: 2 }}
      >
        {USERS.map((u) => (
          <MenuItem key={u} value={u}>
            {u}
          </MenuItem>
        ))}
      </Select>

      {/* Filter Select */}
      <Select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ ml: 2 }}
      >
        <MenuItem value="All">All</MenuItem>
        {Array.from(
          new Set([
            ...SUPPLEMENTS_PLAN.weekdays,
            ...SUPPLEMENTS_PLAN.dailyDinesh,
          ])
        ).map((supp) => (
          <MenuItem key={supp} value={supp}>
            {supp}
          </MenuItem>
        ))}
      </Select>

      {/* Today's Checklist */}
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Today’s Supplements
        </Typography>
        {Array.from(
          new Set([
            ...SUPPLEMENTS_PLAN.weekdays,
            ...SUPPLEMENTS_PLAN.dailyDinesh,
          ])
        ).map((supp) => {
          const plannedForToday = todaySupplements.includes(supp);
          const checked =
            data[format(selectedDate, "yyyy-MM-dd")]?.includes(supp) || false;

          return (
            <FormControlLabel
              key={supp}
              control={
                <Checkbox
                  checked={checked}
                  onChange={() =>
                    plannedForToday &&
                    toggleSupplementForDate(
                      selectedDate,
                      supp
                    )
                  }
                  disabled={!plannedForToday}
                />
              }
              label={supp + (plannedForToday ? "" : " (not scheduled)")}
              sx={{
                color: plannedForToday ? "text.primary" : "text.disabled",
                opacity: plannedForToday ? 1 : 0.5,
              }}
            />
          );
        })}
      </Box>

      {/* Heatmap */}
      <ClickAwayListener onClickAway={() => setSelectedDate(null)}>
      <Box>
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          {format(currentMonth, "MMMM yyyy")}
        </Typography>

        {/* Month navigation */}
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Button
            variant="outlined"
            onClick={() =>
              setCurrentMonth((m) => {
                const prev = subMonths(m, 1);
                return prev >= minMonth ? prev : m;
              })
            }
            disabled={currentMonth <= minMonth}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              setCurrentMonth((m) => {
                const next = addMonths(m, 1);
                return next <= maxMonth ? next : m;
              })
            }
            disabled={currentMonth >= maxMonth}
          >
            Next
          </Button>
        </Box>

        {/* Color Legend */}
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <LegendBox color="#ebedf0" label="No supplements taken" />
          <LegendBox color="#9be9a8" label="Some supplements taken" />
          <LegendBox color="#40c463" label="All planned supplements taken" />
          <LegendBox color="#dbe4ee" label="Future date" />
        </Box>

        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={Array.from(
            { length: (endDate - startDate) / (1000 * 60 * 60 * 24) + 1 },
            (_, i) => {
              const date = new Date(startDate);
              date.setDate(startDate.getDate() + i);
              const dateStr = format(date, "yyyy-MM-dd");

              const supplements = data[dateStr] || [];
              const planned = getPlannedSupplements(dateStr, user);

              const relevantSupps =
                filter === "All"
                  ? supplements
                  : supplements.includes(filter)
                  ? [filter]
                  : [];

              let count =
                relevantSupps.length === 0
                  ? 0
                  : relevantSupps.length === planned.length
                  ? 2
                  : 1;

              return { date: dateStr, count };
            }
          )}
          classForValue={(value) => {
            if (!value) return "color-empty";
            const valueDate = new Date(value.date);
            const isFuture =
              isAfter(valueDate, today) && !isSameDay(valueDate, today);
            if (isFuture) return "future-cell";
            if (selectedDate && isSameDay(valueDate, new Date(selectedDate)))
              return "selected-cell";
            if (value.count === 0) return "color-github-0";
            if (value.count === 1) return "color-github-1";
            return "color-github-2";
          }}
          onClick={(value) => {
            if (value?.date) {
              const valueDate = new Date(value.date);
              const isFuture =
                isAfter(valueDate, today) && !isSameDay(valueDate, today);
              if (isFuture) return; // No edit on future
              setSelectedDate(value.date);
              const planned = getPlannedSupplements(value.date, user);
              setEditDate(value.date);
              setEditSupplements(data[value.date] || planned);
            }
          }}
        />
      </Box>
      

      {/* Edit Modal */}
      <Dialog
        open={!!editDate}
        onClose={() => setEditDate(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Supplements – {editDate}</DialogTitle>
        <DialogContent>
          {Array.from(
            new Set([
              ...SUPPLEMENTS_PLAN.weekdays,
              ...SUPPLEMENTS_PLAN.dailyDinesh,
            ])
          ).map((supp) => {
            const plannedForDate = getPlannedSupplements(
              editDate,
              user
            ).includes(supp);
            return (
              <FormControlLabel
                key={supp}
                control={
                  <Checkbox
                    checked={editSupplements.includes(supp)}
                    onChange={() => {
                      if (!plannedForDate) return;
                      setEditSupplements((prev) =>
                        prev.includes(supp)
                          ? prev.filter((s) => s !== supp)
                          : [...prev, supp]
                      );
                    }}
                    disabled={!plannedForDate}
                  />
                }
                label={supp + (plannedForDate ? "" : " (not scheduled)")}
                sx={{
                  color: plannedForDate ? "text.primary" : "text.disabled",
                  opacity: plannedForDate ? 1 : 0.5,
                }}
              />
            );
          })}
          <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
            <Button onClick={() => setEditDate(null)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                const updatedDayData = editSupplements;
                const newData = {
                  ...data,
                  [editDate]: updatedDayData,
                };
                setData(newData);
                localStorage.setItem(`supp-${user}`, JSON.stringify(newData));
                fetch("/api/set", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    user,
                    date: editDate,
                    supplements: updatedDayData,
                  }),
                });
                setEditDate(null);
              }}
            >
              Save
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      </Box>
      </ClickAwayListener>

      {/* Styles */}
      <style>{`
        .future-cell {
          fill: #dbe4ee;
          cursor: not-allowed;
        }
        .selected-cell {
          fill: #b2cdedff;
          stroke: #000000ff;
        }
      `}</style>
    </Box>
  );
}

function LegendBox({ color, label }) {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Box
        sx={{
          width: 20,
          height: 20,
          bgcolor: color,
          borderRadius: 0,
          border: "1px solid #ccc",
        }}
      />
      <Typography variant="body2">{label}</Typography>
    </Box>
  );
}

function getPlannedSupplements(date, user) {
  const dayName = format(new Date(date), "EEEE");
  let plan = [];
  if (
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(dayName)
  ) {
    plan = [...SUPPLEMENTS_PLAN.weekdays];
  }
  if (user === "Dinesh") {
    plan = [...plan, ...SUPPLEMENTS_PLAN.dailyDinesh];
  }
  return plan;
}
