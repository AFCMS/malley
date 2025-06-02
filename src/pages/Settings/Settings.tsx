import TopBar from "../../layouts/TopBar/TopBar";

export default function Settings() {
  return (
    <div className="m flex w-full flex-col">
      <TopBar title="Settings" />
      <div className="flex w-full flex-col gap-4 p-4">
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
          <legend className="fieldset-legend">Bio</legend>
          <div className="join">
            <input id="bio" type="text" className="input join-item w-full" placeholder="" />
            <button className="btn join-item">Save</button>
          </div>
        </fieldset>
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
          <legend className="fieldset-legend">Avatar</legend>
          <div className="join">
            <input id="avatar" type="file" className="file-input join-item w-full" placeholder="" />
            <button className="btn join-item">Save</button>
          </div>
          <label className="label">Max size 2MB</label>
        </fieldset>
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
          <legend className="fieldset-legend">Banner</legend>
          <div className="join">
            <input id="banner" type="file" className="file-input join-item w-full" placeholder="" />
            <button className="btn join-item">Save</button>
          </div>
          <label className="label">Max size 2MB</label>
        </fieldset>
      </div>
    </div>
  );
}
